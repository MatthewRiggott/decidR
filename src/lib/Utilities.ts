declare global {
  interface Array<T> {
    shuffle(): Array<T>
  }
}


export default Array.prototype.shuffle = function(): any[] {  
  const newArr = this.slice()
  for (let i = newArr.length - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
  }
  return newArr
} 