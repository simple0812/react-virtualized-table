/**
 * @description Loading 组件
 * @date 2018.01.10
 * @author abc
 */

import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';

const Loading = (props) => (
  <div className="wechat-loading-wrapper" style={{ ...props.style }}>
    <div className="line-scale">
      <div className="layui-layer-content">
        <div style={{background: `${props.loadingColor ? props.loadingColor : '#d1d1d1'}`}}/>
        <div style={{background: `${props.loadingColor ? props.loadingColor : '#d1d1d1'}`}}/>
        <div style={{background: `${props.loadingColor ? props.loadingColor : '#d1d1d1'}`}}/>
        <div style={{background: `${props.loadingColor ? props.loadingColor : '#d1d1d1'}`}}/>
        <div style={{background: `${props.loadingColor ? props.loadingColor : '#d1d1d1'}`}}/>
      </div>
    </div>
    <p>{props.title}</p>
  </div>
);
// 默认props值
Loading.defaultProps = {
  title: '正在加载...'
};
// props 类型
Loading.propTypes = {
  title: PropTypes.string,
  style: PropTypes.object
};

export default Loading;
