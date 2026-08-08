import React, { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';

interface DonutProps {
  sensors: Array<{
    thresholdInfo: {
      text: string;
      color: string;
      severity: string;
    };
  }>;
}

const ThresholdDistributionChart: React.FC<DonutProps> = ({ sensors }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, 'dark', {
      renderer: 'canvas',
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || !sensors) return;

    // Count severities
    const countMap: Record<string, { count: number; color: string }> = {
      'Normal': { count: 0, color: '#22c55e' },
      'High Warning': { count: 0, color: '#f97316' },
      'High Critical': { count: 0, color: '#ef4444' },
      'Low Warning': { count: 0, color: '#eab308' },
      'Low Critical': { count: 0, color: '#3b82f6' },
    };

    sensors.forEach((s) => {
      const text = s.thresholdInfo?.text || 'Normal';
      if (!countMap[text]) {
        countMap[text] = { count: 0, color: '#71717a' };
      }
      countMap[text].count += 1;
    });

    const data = Object.entries(countMap)
      .filter(([_, item]) => item.count > 0)
      .map(([name, item]) => ({
        name,
        value: item.count,
        itemStyle: { color: item.color },
      }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(22, 25, 33, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        formatter: '{b}: <strong>{c} Sensors ({d}%)</strong>',
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        textStyle: { color: '#a1a1aa', fontSize: 10 },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
          },
          data,
        },
      ],
    };

    chartInstance.current.setOption(option, false);
  }, [sensors]);

  return <div ref={chartRef} style={{ width: '100%', height: '140px' }} />;
};

export default memo(ThresholdDistributionChart);
