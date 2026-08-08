import React, { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';

interface GaugeProps {
  score: number; // 0 to 100
  activeCount: number;
  totalCount: number;
}

const SystemHealthGauge: React.FC<GaugeProps> = ({ score, activeCount, totalCount }) => {
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
    if (!chartInstance.current) return;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '95%',
          center: ['50%', '70%'],
          itemStyle: {
            color: score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444',
          },
          progress: {
            show: true,
            roundCap: true,
            width: 12,
          },
          pointer: {
            show: true,
            length: '60%',
            width: 4,
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 12,
              color: [
                [1, 'rgba(255, 255, 255, 0.08)'],
              ],
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-15%'],
            fontSize: 24,
            fontWeight: 'bold',
            formatter: '{value}%',
            color: 'inherit',
          },
          data: [
            {
              value: Math.round(score),
            },
          ],
        },
      ],
    };

    chartInstance.current.setOption(option, false);
  }, [score]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '140px' }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '2px', 
        left: 0, 
        right: 0, 
        textAlign: 'center', 
        fontSize: '0.78rem', 
        color: 'var(--text-secondary)' 
      }}>
        Online: <strong>{activeCount}</strong> / {totalCount} Sensors
      </div>
    </div>
  );
};

export default memo(SystemHealthGauge);
