import React, { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';

interface TimelineProps {
  sensors: Array<{
    sensor_id: string;
    site_name?: string;
    unit_of_measure: string;
    latestReading?: {
      measurement: number;
      timestamp: string;
    };
    timeAgo: {
      text: string;
      hoursAgo: number;
      isInactive: boolean;
    };
    batteryStatus: number | null;
    isOffline: boolean;
    isLowBattery: boolean;
    isInactive: boolean;
  }>;
  onSelectSensor?: (sensorId: string) => void;
}

const TimelineVisualizationChart: React.FC<TimelineProps> = ({ sensors, onSelectSensor }) => {
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

    const yCategories = sensors.map((s) => s.sensor_id);
    
    const seriesData = sensors.map((s, idx) => {
      const hoursAgo = Math.min(80, s.timeAgo.hoursAgo || 0);
      let color = '#22c55e'; // Online
      if (s.isOffline) color = '#7f1d1d'; // Offline (Dark red)
      else if (s.isInactive) color = '#ef4444'; // Inactive
      else if (s.isLowBattery) color = '#f59e0b'; // Low Battery

      return {
        value: [hoursAgo, idx, s.latestReading?.measurement ?? 0],
        itemStyle: { 
          color,
          shadowBlur: 10,
          shadowColor: color,
        },
        sensor: s,
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 1000,
      grid: {
        top: 25,
        bottom: 35,
        left: 55,
        right: 25,
        containLabel: false,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(22, 25, 33, 0.95)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        formatter: (params: any) => {
          const s = params.data.sensor;
          const val = s.latestReading?.measurement !== undefined ? `${s.latestReading.measurement} ${s.unit_of_measure}` : 'No Data';
          return `
            <div style="padding: 4px 6px;">
              <div style="font-weight: 600; color: #ffffff;">Sensor ${s.sensor_id} (${s.site_name || 'Station'})</div>
              <div style="color: #a1a1aa; font-size: 11px; margin-top: 3px;">
                Pulse: <strong>${s.timeAgo.text}</strong><br/>
                Reading: <strong>${val}</strong><br/>
                Battery: <strong>${s.batteryStatus !== null ? `${s.batteryStatus}%` : 'N/A'}</strong>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        name: 'Hours Ago',
        nameLocation: 'middle',
        nameGap: 22,
        inverse: true, // 0 hours ago on right, older on left
        min: 0,
        max: 80,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisLabel: { color: '#a1a1aa', fontSize: 10, formatter: '{value}h' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      },
      yAxis: {
        type: 'category',
        data: yCategories,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisLabel: { color: '#a1a1aa', fontSize: 11 },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 16,
          data: seriesData,
          markArea: {
            silent: true,
            data: [
              [
                { xAxis: 0, itemStyle: { color: 'rgba(34, 197, 94, 0.03)' } },
                { xAxis: 48 },
              ],
              [
                { xAxis: 48, itemStyle: { color: 'rgba(239, 68, 68, 0.05)' } },
                { xAxis: 80 },
              ],
            ],
          },
          markLine: {
            silent: true,
            animation: false,
            data: [
              { xAxis: 48, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '48h Inactive', color: '#ef4444', fontSize: 9 } },
              { xAxis: 72, lineStyle: { color: '#7f1d1d', type: 'dashed' }, label: { formatter: '72h Offline', color: '#7f1d1d', fontSize: 9 } },
            ],
          },
        },
      ],
    };

    chartInstance.current.setOption(option, false);

    const handleClick = (params: any) => {
      if (params.data?.sensor && onSelectSensor) {
        onSelectSensor(params.data.sensor.sensor_id);
      }
    };

    chartInstance.current.off('click');
    chartInstance.current.on('click', handleClick);
  }, [sensors, onSelectSensor]);

  return <div ref={chartRef} style={{ width: '100%', height: '230px' }} />;
};

export default memo(TimelineVisualizationChart);
