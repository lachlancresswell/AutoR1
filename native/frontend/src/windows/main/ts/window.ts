import { events, app, debug } from "@neutralinojs/lib";
events.on("windowClose",() => {
    app.exit(0).catch(console.error)
}).catch(console.error).then(()=>{
    debug.log("Attached window closer").catch(console.error)
})