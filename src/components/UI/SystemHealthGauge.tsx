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

    const healthColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 1200,
      animationEasingUpdate: 'cubicOut',
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '95%',
          center: ['50%', '65%'],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 0.5, color: '#8b5cf6' },
              { offset: 1, color: healthColor },
            ]),
          },
          progress: {
            show: true,
            roundCap: true,
            width: 14,
          },
          pointer: {
            show: true,
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '55%',
            width: 8,
            offsetCenter: [0, '5%'],
            itemStyle: {
              color: healthColor,
              shadowBlur: 10,
              shadowColor: healthColor,
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 14,
              color: [
                [1, 'rgba(255, 255, 255, 0.06)'],
              ],
            },
          },
          axisTick: {
            distance: -20,
            splitNumber: 5,
            lineStyle: {
              width: 1.5,
              color: 'rgba(255, 255, 255, 0.25)',
            },
          },
          splitLine: {
            distance: -24,
            length: 10,
            lineStyle: {
              width: 2.5,
              color: 'rgba(255, 255, 255, 0.4)',
            },
          },
          axisLabel: {
            distance: -38,
            color: '#a1a1aa',
            fontSize: 10,
          },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '25%'],
            fontSize: 32,
            fontWeight: 'bold',
            formatter: '{value}%',
            color: '#ffffff',
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
    <div style={{ position: 'relative', width: '100%', height: '230px' }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        left: 0, 
        right: 0, 
        textAlign: 'center', 
        fontSize: '0.84rem', 
        color: 'var(--text-secondary)' 
      }}>
        Online Stations: <strong>{activeCount}</strong> / {totalCount}
      </div>
    </div>
  );
};

export default memo(SystemHealthGauge);
