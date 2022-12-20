if (document.querySelector("canvas") != null) {
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

    submitBtn.addEventListener("click", () => {
        signatureField.value = canv.toDataURL();
    });

    function getMousePos(canvas, ev) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top,
        };
    }
}

if (document.querySelector("#unsignForm") != null) {
    const unsignBtn = document.querySelector("#unsign-btn");
    const popUp = document.querySelector(".popUp");
    const noBtn = document.querySelector(".no");

    unsignBtn.addEventListener("click", () => {
        popUp.classList.remove("hidden");
    });

    noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        popUp.classList.add("hidden");
    });
}
