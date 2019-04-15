import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// 根组件
const Root = () => (
  <App />
);

ReactDOM.render(
  <Root />,
  document.getElementById('root')
);
registerServiceWorker();
