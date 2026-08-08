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
      grid: {
        top: 20,
        bottom: 30,
        left: 35,
        right: 15,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(22, 25, 33, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        formatter: (params: any) => {
          const item = params[0];
          return `Sensor <strong>${item.name}</strong>: ${item.value}% Battery`;
        },
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisLabel: { color: '#a1a1aa', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#a1a1aa', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      },
      series: [
        {
          type: 'bar',
          data: yData,
          barWidth: '40%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params: any) => {
              const val = params.value;
              if (val < 25) return '#ef4444';
              if (val < 50) return '#f59e0b';
              return '#22c55e';
            },
          },
          markLine: {
            silent: true,
            animation: false,
            data: [
              {
                yAxis: 25,
                name: 'Low Battery (25%)',
                lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
                label: { formatter: '25% Limit', color: '#ef4444', fontSize: 9 },
              },
            ],
          },
        },
      ],
    };

    chartInstance.current.setOption(option, false);
  }, [sensors]);

  return <div ref={chartRef} style={{ width: '100%', height: '140px' }} />;
};

export default memo(BatteryDistributionChart);
