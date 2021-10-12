import helloWorld from "./helloWorld";

const helloWorldStr = helloWorld();

function component() {
  const element = document.createElement("div");

  element.innerText = helloWorldStr;

  return element;
}

document.body.appendChild(component());