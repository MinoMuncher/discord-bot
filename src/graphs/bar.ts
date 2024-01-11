import { type Players, type ClearTypes, ClearType } from "../stats"
import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js/auto'

Chart.defaults.font.size = 20
Chart.defaults.color = '#f9f6f2'
Chart.defaults.borderColor = '#1e1e1e'

function getTotalClears(stats: ClearTypes) {
    let total = 0;
    let key: ClearType
    for (key in stats) {
      if (key == 'NONE' || key == 'TSPIN' || key == 'TSPIN_MINI') continue
      total += stats[key]
    }
    return total
}

export async function createLineClearGraph(parsedPlayers: Players, order: string[]) {
    const combinedCanvas = createCanvas(200*Object.keys(parsedPlayers).length*4, 200*4)
    const combinedCanvasCtx = combinedCanvas.getContext('2d')
    let offset = 0
    let usernames = Object.keys(parsedPlayers)
    usernames.sort((a,b)=>{
      const a1 = order.findIndex(v=>v==a)
      const b1 = order.findIndex(v=>v==b)
      return (a1==-1 ? 50 : a1) - (b1==-1 ? 50 : b1)
    })
  
    for(const username of usernames){
        const stats = parsedPlayers[username]
        const total = getTotalClears(stats.clearTypes)
        const canvas = createCanvas(200*4, 200*4)

      
        const data = {
          labels: [username],
          datasets: [
            {
              label: `Singles ${(stats.clearTypes.SINGLE / total * 100).toFixed(2)}% (${stats.clearTypes.SINGLE})`,
              data: [stats.clearTypes.SINGLE / total * 100],
              backgroundColor: "#dc8580",
              rawData: [stats.clearTypes.SINGLE],

            },
            {
              label: `Doubles ${(stats.clearTypes.DOUBLE / total * 100).toFixed(2)}% (${stats.clearTypes.DOUBLE})`,
              data: [stats.clearTypes.DOUBLE / total * 100],
              backgroundColor: "#E7B699",
              rawData: [stats.clearTypes.DOUBLE],

            },
            {
              label: `Triples ${(stats.clearTypes.TRIPLE / total * 100).toFixed(2)}% (${stats.clearTypes.TRIPLE})`,
              data: [stats.clearTypes.TRIPLE / total * 100],
              backgroundColor: "#f2e6b1",
              rawData: [stats.clearTypes.TRIPLE],

            },
            {
              label: `Quads ${((stats.clearTypes.QUAD + stats.clearTypes.PENTA) / total * 100).toFixed(2)}% (${(stats.clearTypes.QUAD + stats.clearTypes.PENTA)})`,
              data: [(stats.clearTypes.QUAD + stats.clearTypes.PENTA) / total * 100],
              backgroundColor: "#83b2d0",
              rawData: [stats.clearTypes.QUAD + stats.clearTypes.PENTA],

            },
            {
              label: `Tspin Singles ${((stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE) / total * 100).toFixed(2)}% (${stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE})`,
              data: [(stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE) / total * 100],
              backgroundColor: "#8686CE",
              rawData: [stats.clearTypes.TSPIN_SINGLE + stats.clearTypes.TSPIN_MINI_SINGLE],

            },
            {
              label: `Tspin Doubles ${((stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE) / total * 100).toFixed(2)}% (${stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE})`,
              data: [(stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE) / total * 100],
              backgroundColor: "#885ACC",
              rawData: [(stats.clearTypes.TSPIN_DOUBLE + stats.clearTypes.TSPIN_MINI_DOUBLE)],

            },
            {
              label: `Tspin Triples ${((stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA) / total * 100).toFixed(2)}% (${stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA})`,
              data: [(stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA) / total * 100],
              backgroundColor: "#F8C8DC",
              rawData: [(stats.clearTypes.TSPIN_TRIPLE + stats.clearTypes.TSPIN_QUAD + stats.clearTypes.TSPIN_PENTA)],

            },
            {
              label: `All Clears ${(stats.clearTypes.PERFECT_CLEAR / total * 100).toFixed(2)}% (${stats.clearTypes.PERFECT_CLEAR})`,
              data: [stats.clearTypes.PERFECT_CLEAR / total * 100],
              backgroundColor: "#95dab6",
              rawData: [stats.clearTypes.PERFECT_CLEAR],

            },
          ]
        };
      
        new Chart(canvas, {
          type: 'bar',
          data: data,
          options: {
            maintainAspectRatio: false,
            layout: {
              padding: 10,
            },
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
                align: 'start',
                maxWidth: 100*7,
              },
            }
          }
        })
      
        var ctx = canvas.getContext("2d");
      
        ctx.globalCompositeOperation = 'destination-over'
      
        ctx.fillStyle = "#292929";
        ctx.beginPath();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        combinedCanvasCtx.drawImage(canvas, offset, 0)
        offset += 200*4
    }


  const imageData = await combinedCanvas.encode('webp')
  return imageData
}
