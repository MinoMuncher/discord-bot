import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js/auto'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';

export type RadarConfig = {
  label: string,
  min: number,
  max: number,
  format: (n: number) => string
}[]

export type RadarData = { [player: string]: number[] }

function normalizeStat(value: number, min: number, max: number) {
  const range = max - min
  let truncated_value = value - min
  return truncated_value / range
}

function generateOffsets(datasets: { data: number[], index: number }[]) {
  let offsets = datasets.map(x => [...x.data])
  if (datasets.length <= 1) return offsets
  for (let i = 0; i < datasets[0].data.length; i += 1) {
    let tolerance = 0.2
    if (datasets[0].data.length % 2 == 0) {
      if (i == 0 || i == datasets[0].data.length / 2) {
        tolerance = 0.15
      }
    }
    datasets.sort((a, b) => a.data[i] - b.data[i])
    for (let j = 1; j < datasets.length; j += 1) {
      const J = datasets[j].index
      const K = datasets[j - 1].index
      const offset = datasets[j].data[i] - offsets[K][i]
      if (offset >= 0 && offset < tolerance) {
        offsets[J][i] = offsets[K][i] + tolerance
      } else if (offset < 0) {
        offsets[J][i] = offsets[K][i] + tolerance
      }
    }
  }
  return offsets
}

export async function createRadarGraph(players: RadarData, template: RadarConfig, order: string[]) {

  const canvas = createCanvas(200, 200)

  function offsetStat(value: number, index: number) {
    const max = template[index].max
    const min = template[index].min
    const range = max - min
    return value * range + min
  }

  let datasets: {
    label: string;
    data: number[];
  }[] = []

  let usernames = Object.keys(players)
  usernames.sort((a,b)=>{
    const a1 = order.findIndex(v=>v===a)
    const b1 = order.findIndex(v=>v===b)
    return (a1==-1 ? 50 : a1) - (b1==-1 ? 50 : b1)
  })

  for (const username of usernames) {
    let data = []
    for (let i = 0; i < template.length; i++) {
      data.push(normalizeStat(players[username][i], template[i].min, template[i].max))
    }
    datasets.push({
      label: username,
      data,
    })
  }

  const offsets = generateOffsets(datasets.map((x, index) => { return { data: x.data, index } }))

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
        datalabels: {
          color: "#f9f6f2",
          borderRadius: 4,
          backgroundColor: function (context: Context) {
            return context.dataset.backgroundColor;
          },
          borderWidth: 1,
          borderColor: function (context: Context) {
            return context.dataset.borderColor;
          },
          offset: function (context: Context) {
            return 160 * (offsets[context.datasetIndex][context.dataIndex] - datasets[context.datasetIndex].data[context.dataIndex])
          },
          align: 'end',
          formatter: function (value, context) {
            return template[context.dataIndex].format(offsetStat(value, context.dataIndex))
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
