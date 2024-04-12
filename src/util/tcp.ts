import { connect, NetConnectOpts, Socket } from 'net'

export class SyncSocket {
    socket: Socket
    receptionStringBuffer = ""
    dataRecievedCallback = () => { }
    private constructor(options: NetConnectOpts) {
        this.socket = connect(options)
        this.socket.on("data", (data) => {
            this.recieveData(data)
        })
    }
    writeLine(line: string) {
        this.socket.write(line + '\n')
    }
    readLine(): Promise<string> {
        return new Promise((resolve) => {
            const line = this.processBuffer()
            if (line != undefined) resolve(line)

            this.dataRecievedCallback = () => {
                const line = this.processBuffer()
                if (line != undefined) resolve(line)
            }
        })
    }
    processBuffer(): string | undefined {
        const newLineIndex = this.receptionStringBuffer.indexOf('\n')
        if (newLineIndex != -1) {
            const line = this.receptionStringBuffer.substring(0, newLineIndex)
            this.receptionStringBuffer = this.receptionStringBuffer.substring(newLineIndex + 1)
            return line
        }
        return undefined
    }
    private recieveData(data: Buffer) {
        this.receptionStringBuffer += data.toString()
        this.dataRecievedCallback()
    }

    public static CreateAsync = (options: NetConnectOpts): Promise<SyncSocket> => {
        return new Promise((resolve, reject) => {
            const me = new SyncSocket(options);
            me.socket.on("connect", () => {
                resolve(me);
            })
            me.socket.on("close", () => {
                reject(new Error("failed to connect"))
            })
        })

    };

    public dispose() {
        if (this.socket) {
            this.socket.end();
            this.socket.destroy();
            this.socket = null;
        }
    }
}