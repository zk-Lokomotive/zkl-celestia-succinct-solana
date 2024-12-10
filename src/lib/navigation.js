export function navigate(path) {
  if (path === '/upload') {
    const app = document.querySelector('#app');
    const walletComponent = document.createElement('div');
    walletComponent.innerHTML = '<WalletConnection />';
    app.appendChild(walletComponent);
  }
}