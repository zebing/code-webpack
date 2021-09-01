import helloworld from "./helloworld";
import component from "./component";

var setup = () => {
  const wrap = document.createElement('div');
  const helloworldElement = document.createElement('div');
  helloworldElement.innerHTML = helloworld;
  wrap.appendChild(helloworldElement);
  wrap.appendChild(component());
  document.body.appendChild(wrap);
}

setup();

