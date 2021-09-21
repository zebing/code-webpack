export default () => {
  const div = document.createElement('div');
  div.innerHTML = 'this is a component';
  div.style.cssText = `
    width: 200px;
    height: 200px;
    background: blue;
    color: #fff;
  `;
  return div;
}