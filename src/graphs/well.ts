import { type Players } from "../stats"
import { createCanvas } from '@napi-rs/canvas'
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js/auto'

export async function createWellGraph(parsedPlayers: Players, scale: boolean, order: string[]) {
    const combinedCanvas = createCanvas(200 * 4, 200 * 4 * Object.keys(parsedPlayers).length)
    const combinedCanvasCtx = combinedCanvas.getContext('2d')
    let offset = 0
    let usernames = Object.keys(parsedPlayers)
    usernames.sort((a, b) => {
        const a1 = order.findIndex(v => v == a)
        const b1 = order.findIndex(v => v == b)
        return (a1 == -1 ? 50 : a1) - (b1 == -1 ? 50 : b1)
    })


    for (const username of usernames) {
        const stats = parsedPlayers[username]
        const total = stats.wellColumns.reduce((partialSum, a) => partialSum + a, 0);
        const canvas = createCanvas(200 * 4, 200 * 4)
        const data = {
            labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            datasets: [{
                label: username +'\'s Well Column Distribution',
                data: stats.wellColumns.map(x=>x/total),
                borderWidth: 1
            }],
        };

        new Chart(canvas, {
            type: 'bar',
            plugins: [ChartDataLabels],
            data: data,
            options: {
                layout: {
                    padding: 10,
                },
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: scale ? Math.max(...stats.wellColumns)/total + 0.04 : 0.4
                    }
                },
                plugins:{
                    datalabels: {
                        color: 'white',
                        font: {
                          weight: 'bold'
                        },
                        anchor: 'start',
                        align: 'end',
                        offset: 20,
                        formatter(value: number, _context: Context){
                            return `${Math.round(value*100)}%`
                        }
                      }
                }
            },
        });

        var ctx = canvas.getContext("2d");

        ctx.globalCompositeOperation = 'destination-over'

        ctx.fillStyle = "#292929";
        ctx.beginPath();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        combinedCanvasCtx.drawImage(canvas, 0, offset)
        offset += 200 * 4
    }


    const imageData = await combinedCanvas.encode('webp')
    return imageData
}
