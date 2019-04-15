import React, { Component } from 'react';
import { localClass } from './index.scss';
import noData from './images/no-data.svg';


class EmptyHolder extends Component {
  render() {
    const { placeholder, style } = this.props;
    return (
      <div className={localClass} style={{...style}}>
        <img src={noData} alt='' />
        <p className="no-data">{ placeholder || '暂无记录' }</p>
      </div>
    );
  }
}

export default EmptyHolder;