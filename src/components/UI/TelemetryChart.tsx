import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { TelemetryReading } from '../../services/gisTelemetryApi';

interface TelemetryChartProps {
  data: TelemetryReading[];
  unit: string;
  thresholds: {
    highCritical: number;
    highWarning: number;
    lowWarning: number;
    lowCritical: number;
  };
}

const TelemetryChart: React.FC<TelemetryChartProps> = ({ data, unit, thresholds }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize ECharts instance
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
    if (!chartInstance.current || !data) return;

    // Prepare data
    const xData = data.map((d) => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + 
             date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    
    const yData = data.map((d) => d.measurement);

    // Create markLines for thresholds
    const markLineData: any[] = [];
    
    if (thresholds.highCritical !== undefined) {
      markLineData.push({
        yAxis: thresholds.highCritical,
        name: 'High Critical',
        lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
        label: {
          formatter: `Critical: {c} ${unit}`,
          position: 'end',
          color: '#ef4444',
          fontSize: 10,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: [2, 4],
          borderRadius: 4
        },
      });
    }

    if (thresholds.highWarning !== undefined) {
      markLineData.push({
        yAxis: thresholds.highWarning,
        name: 'High Warning',
        lineStyle: { color: '#f97316', type: 'dashed', width: 1.2 },
        label: {
          formatter: `Warning: {c} ${unit}`,
          position: 'end',
          color: '#f97316',
          fontSize: 10,
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          padding: [2, 4],
          borderRadius: 4
        },
      });
    }

    if (thresholds.lowWarning !== undefined) {
      markLineData.push({
        yAxis: thresholds.lowWarning,
        name: 'Low Warning',
        lineStyle: { color: '#eab308', type: 'dashed', width: 1.2 },
        label: {
          formatter: `Low Warn: {c} ${unit}`,
          position: 'end',
          color: '#eab308',
          fontSize: 10,
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          padding: [2, 4],
          borderRadius: 4
        },
      });
    }

    if (thresholds.lowCritical !== undefined) {
      markLineData.push({
        yAxis: thresholds.lowCritical,
        name: 'Low Critical',
        lineStyle: { color: '#3b82f6', type: 'dashed', width: 1.5 },
        label: {
          formatter: `Low Crit: {c} ${unit}`,
          position: 'end',
          color: '#3b82f6',
          fontSize: 10,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: [2, 4],
          borderRadius: 4
        },
      });
    }

    // Set configuration options
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        top: 40,
        bottom: 75,
        left: 55,
        right: 120,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(22, 25, 33, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: {
          color: '#ffffff',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: 600; color: #a1a1aa; margin-bottom: 4px;">${item.name}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></span>
                <span>Reading: <strong>${item.value} ${unit}</strong></span>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.15)' },
        },
        axisLabel: {
          color: '#a1a1aa',
          fontSize: 10,
          rotate: 15,
        },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: '#a1a1aa',
          fontSize: 10,
          formatter: `{value} ${unit}`,
        },
        splitLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          bottom: 10,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: {
            color: '#3b82f6',
            borderColor: 'transparent',
          },
          textStyle: {
            color: '#71717a',
            fontSize: 9,
          },
        },
      ],
      series: [
        {
          name: 'Telemetry Reading',
          type: 'line',
          data: yData,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          itemStyle: {
            color: '#3b82f6',
          },
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#8b5cf6' },
            ]),
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.00)' },
            ]),
          },
          markLine: {
            silent: true,
            data: markLineData,
          },
        },
      ],
    };

    chartInstance.current.setOption(option);
  }, [data, unit, thresholds]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '260px' 
      }} 
    />
  );
};

export default TelemetryChart;
