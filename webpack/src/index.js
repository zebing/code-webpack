import helloworld, { test1, test2 } from "./helloworld";
import component from "./component";
import styles from './styles.module.css';
console.log(styles)

var setup = () => {
  const wrap = document.createElement('div');
  const helloworldElement = document.createElement('div');
  helloworldElement.className = styles.test;
  helloworldElement.innerHTML = helloworld;
  wrap.appendChild(helloworldElement);
  wrap.appendChild(component());
  document.body.appendChild(wrap);
}

setup();

