import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.defaults.font.size = 20
Chart.defaults.color = '#f9f6f2'
Chart.defaults.borderColor = '#91908E'

export type RadarConfig = {
  label: string,
  min: number,
  max: number,
}[]

export type RadarData = { [player: string]: number[] }

function normalizeStat(value: number, min: number, max: number) {
  const range = max - min
  let truncated_value = value - min
  return truncated_value / range
}

export async function createRadarGraph(players: RadarData, template: RadarConfig) {

  const canvas = createCanvas(200, 200)

  function offsetStat(value: number, index: number){
    const max = template[index].max
    const min = template[index].min
    const range = max - min
    return value*range + min
  }

  let datasets = []
  for (const username in players) {
    let data = []
    for (let i = 0; i < template.length; i++) {
      data.push(normalizeStat(players[username][i], template[i].min, template[i].max))
    }
    datasets.push({
      label: username,
      data,
    })
  }
  const data = {
    labels: template.map(x => x.label),
    datasets
  };
  new Chart(canvas, {
    plugins: [ChartDataLabels],
    type: 'radar',
    data: data,
    options: {
      plugins: {
        datalabels:{
          color: "#f9f6f2",
          borderRadius: 4,
          display: function(context: any){
            const value = context.dataset.data[context.dataIndex]
            if(value > 0.9)return false
            return 'auto'
          },
          backgroundColor: function(context: any) {
            return context.dataset.backgroundColor;
          },
          borderWidth: 1,
          borderColor: function(context: any) {
            return context.dataset.borderColor;
          },
          offset: 10,
          align: 'end',
          formatter: function(value, context) {
            return offsetStat(value, context.dataIndex).toFixed(2);
          }
        }
      },
      layout: {
        padding: 20
      },
      devicePixelRatio: 4,
      elements: {
        line: {
          borderWidth: 3
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 1,
          ticks: {
            display: false,
            maxTicksLimit: 20
          }
        }
      },
    },
  });

  var ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = 'destination-over'
  ctx.fillStyle = "#292929";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageData = await canvas.encode('webp')
  return imageData
}
