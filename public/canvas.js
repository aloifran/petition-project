let isMouseDown = false;
const canv = document.querySelector("canvas");
const ctx = canv.getContext("2d");
const submitBtn = document.querySelector("button");
const signatureField = document.querySelector(".hidden");

canv.addEventListener("mousedown", (ev) => {
    isMouseDown = true;
    let currentPosition = getMousePos(canv, ev);
    ctx.moveTo(currentPosition.x, currentPosition.y);
    ctx.beginPath();
    ctx.lineWidth = 0.3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
});

canv.addEventListener("mousemove", (ev) => {
    if (isMouseDown) {
        let currentPosition = getMousePos(canv, ev);
        ctx.lineTo(currentPosition.x, currentPosition.y);
        ctx.stroke();
    }
});

canv.addEventListener("mouseup", () => {
    isMouseDown = false;
});

submitBtn.addEventListener("mousedown", () => {
    signatureField.value = canv.toDataURL();
});

// GET MOUSE POSITION
function getMousePos(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
    };
}
