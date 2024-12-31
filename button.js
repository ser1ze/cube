function makeButtonClickable(button) {
  console.log(button);
  let lastClickTime = 0;
  const delay = 120;

  function handleMouseDown() {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > delay) {
      button.classList.add("fast-click");
      const descendants = button.querySelectorAll("*");
      descendants.forEach((descendant) =>
        descendant.classList.add("fast-click")
      );
      lastClickTime = currentTime;
    }
  }

  function handleMouseUp() {
    setTimeout(() => {
      button.classList.remove("fast-click");
      const descendants = button.querySelectorAll("*");
      descendants.forEach((descendant) =>
        descendant.classList.remove("fast-click")
      );
    }, delay);
  }

  function handleMouseLeave() {
    button.classList.remove("fast-click");
    const descendants = button.querySelectorAll("*");
    descendants.forEach((descendant) =>
      descendant.classList.remove("fast-click")
    );
  }

  button.addEventListener("mousedown", handleMouseDown);
  button.addEventListener("mouseup", handleMouseUp);
  button.addEventListener("mouseleave", handleMouseLeave);
}
const buyBtn = document.querySelector(".card");

const sliderBtns = document.querySelectorAll(".slider-btn");

if (buyBtn) {
  makeButtonClickable(buyBtn);
}
sliderBtns.forEach((btn) => makeButtonClickable(btn));

document.querySelectorAll(".card-wrap").forEach((card) => {
  const cardElement = card.querySelector(".card");

  card.addEventListener("mousemove", (e) => {
    const rect = cardElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateX = (mouseY / rect.height) * 30 - 15;
    const rotateY = (mouseX / rect.width) * -30 + 15;

    cardElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  });

  card.addEventListener("mouseleave", () => {
    cardElement.style.transition = "transform 0.5s ease-out";
    cardElement.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0px)";
  });
});

window.onload = function () {
  const buyButtons = document.getElementsByClassName("card");
  const sliderBtns = document.getElementsByClassName("slider-btn");

  const addMouseEffect = (buttons) => {
    for (const button of buttons) {
      button.onmousemove = (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        button.style.setProperty("--mouse-x", `${x}px`);
        button.style.setProperty("--mouse-y", `${y}px`);
      };
    }
  };

  addMouseEffect(buyButtons);
  addMouseEffect(sliderBtns);
};
