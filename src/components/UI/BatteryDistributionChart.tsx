import React, { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';

interface BatteryChartProps {
  sensors: Array<{
    sensor_id: string;
    batteryStatus: number | null;
    isLowBattery: boolean;
  }>;
}

const BatteryDistributionChart: React.FC<BatteryChartProps> = ({ sensors }) => {
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

    const xData = sensors.map((s) => s.sensor_id);
    const yData = sensors.map((s) => s.batteryStatus ?? 0);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 1000,
      grid: {
        top: 25,
        bottom: 35,
        left: 45,
        right: 20,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(22, 25, 33, 0.95)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div style="padding: 4px 6px;">
              <div style="font-weight: 600; color: #a1a1aa; margin-bottom: 2px;">Sensor ${item.name}</div>
              <div>Battery Status: <strong>${item.value}%</strong></div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisLabel: { color: '#a1a1aa', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#a1a1aa', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      },
      series: [
        {
          type: 'bar',
          data: yData,
          barWidth: '42%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: (params: any) => {
              const val = params.value;
              if (val < 25) {
                return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#ef4444' },
                  { offset: 1, color: 'rgba(239, 68, 68, 0.2)' },
                ]);
              }
              if (val < 50) {
                return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#f59e0b' },
                  { offset: 1, color: 'rgba(245, 158, 11, 0.2)' },
                ]);
              }
              return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#22c55e' },
                { offset: 1, color: 'rgba(34, 197, 94, 0.2)' },
              ]);
            },
          },
          markLine: {
            silent: true,
            animation: false,
            data: [
              {
                yAxis: 25,
                name: 'Low Battery (25%)',
                lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
                label: { formatter: '25% Low Threshold', color: '#ef4444', fontSize: 10, position: 'end' },
              },
            ],
          },
        },
      ],
    };

    chartInstance.current.setOption(option, false);
  }, [sensors]);

  return <div ref={chartRef} style={{ width: '100%', height: '230px' }} />;
};

export default memo(BatteryDistributionChart);
