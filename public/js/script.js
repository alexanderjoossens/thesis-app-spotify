window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");

    loader.classList.add("loader-hidden");

    loader.addEventListener("transitionend", () => {
        document.body.removeChild("loader");
    })

    knop = document.querySelector("button");

    knop.onclick = function() {
        this.innerHTML = "Wait a moment...";
        this.style = "background: #f1f5f4; color: #333; pointer-events: none";
        setTimeout(() => {
            this.innerHTML = "Almost ready...";
            this.style = "background: #f1f5f4; color: #333; pointer-events: none";
        },2000);
    }
})