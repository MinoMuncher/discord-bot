import { type Players, type ClearTypes, ClearType } from "../stats"
import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js/auto'

Chart.defaults.font.size = 20
Chart.defaults.color = '#f9f6f2'
Chart.defaults.borderColor = '#1e1e1e'

export async function createLineClearGraph(parsedPlayers: Players) {

  const canvas = createCanvas(200, 200)
  function total(stats: ClearTypes) {
    let total = 0;
    let key: ClearType
    for (key in stats) {
      if (key == 'NONE' || key == 'TSPIN' || key == 'TSPIN_MINI') continue
      total += stats[key]
    }
    return total
  }

  const data = {
    labels: Object.keys(parsedPlayers),
    datasets: [
      {
        label: 'Singles',
        data: Object.values(parsedPlayers).map(stats => stats.clearTypes.SINGLE / total(stats.clearTypes) * 100),
        backgroundColor: "#dc8580",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.SINGLE)
      },
      {
        label: 'Doubles',
        data: Object.values(parsedPlayers).map(stats => stats.clearTypes.DOUBLE / total(stats.clearTypes) * 100),
        backgroundColor: "#E7B699",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.DOUBLE)
      },
      {
        label: 'Triples',
        data: Object.values(parsedPlayers).map(stats => stats.clearTypes.TRIPLE / total(stats.clearTypes) * 100),
        backgroundColor: "#f2e6b1",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.TRIPLE)
      },
      {
        label: 'Quads',
        data: Object.values(parsedPlayers).map(stats => (stats.clearTypes.QUAD + stats.clearTypes.PENTA) / total(stats.clearTypes) * 100),
        backgroundColor: "#83b2d0",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.QUAD + stats.clearTypes.PENTA)
      },
      {
        label: 'Tspin Singles',
        data: Object.values(parsedPlayers).map(stats => (stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE) / total(stats.clearTypes) * 100),
        backgroundColor: "#8686CE",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE)
      },
      {
        label: 'Tspin Doubles',
        data: Object.values(parsedPlayers).map(stats => (stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE) / total(stats.clearTypes) * 100),
        backgroundColor: "#885ACC",
        rawData: Object.values(parsedPlayers).map(stats => (stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE))
      },
      {
        label: 'Tspin Triples',
        data: Object.values(parsedPlayers).map(stats => (stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA) / total(stats.clearTypes) * 100),
        backgroundColor: "#F8C8DC",
        rawData: Object.values(parsedPlayers).map(stats => (stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA))
      },
      {
        label: 'All Clears',
        data: Object.values(parsedPlayers).map(stats => stats.clearTypes.PERFECT_CLEAR / total(stats.clearTypes) * 100),
        backgroundColor: "#95dab6",
        rawData: Object.values(parsedPlayers).map(stats => stats.clearTypes.PERFECT_CLEAR)
      },
    ]
  };

  new Chart(canvas, {
    type: 'bar',
    data: data,
    options: {
      layout: {
        padding: 10
      },
      devicePixelRatio: 4,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          max: 100, //sanity check
          ticks:{
            callback: function(val, _index) {
              return val + '%';
            },
          }
        }
      },
      plugins: {
        title:{
          text: "Line Clear Distribution",
          display: true,
          align: 'start'
        },
        legend: {
          display: true,
          position: 'right',
          reverse: true,
          align: 'start'
        }
      }
    }
  })

  var ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = 'destination-over'

  ctx.fillStyle = "#292929";
  ctx.beginPath();
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  const imageData = await canvas.encode('webp')
  return imageData
}
