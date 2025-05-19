"use client"

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface SalesChartProps {
  period: 'daily' | 'weekly' | 'monthly';
  data?: {
    labels?: string[];
    data?: number[];
  };
}

const SalesChart: React.FC<SalesChartProps> = ({ period, data = { labels: [], data: [] } }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy(); // Destroy the previous chart instance if it exists
    }

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    // Use real data if available, or fallback to mock data
    const labels = data?.labels || getMockLabels(period);
    const chartData = data?.data || getMockData(period);

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${period.charAt(0).toUpperCase() + period.slice(1)} Sales`,
            data: chartData,
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            borderColor: 'rgba(124, 58, 237, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgba(124, 58, 237, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            padding: 10,
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: (context) => `$${context.parsed.y.toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: (value) => `$${value}`,
            },
          },
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [period, data]);

  // Mock data generation functions for fallback
  const getMockLabels = (period: string): string[] => {
    const today = new Date();
    
    switch (period) {
      case 'daily':
        return Array(7)
          .fill(0)
          .map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          });
      case 'monthly':
        return Array(12)
          .fill(0)
          .map((_, i) => {
            const date = new Date(today);
            date.setMonth(date.getMonth() - (11 - i));
            return date.toLocaleDateString('en-US', { month: 'short' });
          });
      case 'weekly':
      default:
        return Array(8)
          .fill(0)
          .map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (7 - i) * 7);
            return `Week ${i + 1}`;
          });
    }
  };

  const getMockData = (period: string): number[] => {
    switch (period) {
      case 'daily':
        return [4200, 5800, 3500, 6700, 4900, 7200, 5500];
      case 'monthly':
        return [38000, 42000, 35000, 48000, 52000, 38000, 42000, 45000, 50000, 55000, 48000, 62000];
      case 'weekly':
      default:
        return [24000, 28000, 32000, 26000, 35000, 30000, 38000, 42000];
    }
  };

  return (
    <div className="w-full h-[300px]">
      <canvas ref={chartRef} />
    </div>
  );
};

export default SalesChart;
