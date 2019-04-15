import React, { Component } from 'react';
import cn from 'classnames';

import { localClass } from './index.scss';

class Sorter extends Component {
  constructor(props) {
    super(props);
    this.state = {  }
  }
  render() { 
    const { className, style, sortOrder, onClick } = this.props;
    return ( 
      <div className={cn(localClass, className)} style={style} onClick={onClick}>
        <div className={cn('icons-wrapper', {active: sortOrder === 'ascend'})}><span className='triangle up' /></div>
        <div className={cn('icons-wrapper', {active: sortOrder === 'descend'})}><span className='triangle down' /></div>
      </div> 
    );
  }
}
 
export default Sorter;