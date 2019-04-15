import React, { Component } from 'react';
import cn from 'classnames';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Checkbox, Button, Pagination, Dropdown } from 'antd';
import Loading from '../Loading';
import EmptyHolder from '../EmptyHolder';
import Sorter from '../Sorter';

import leftArrow from './images/left-arrow.svg';
import rightArrow from './images/right-arrow.svg';
import moreIcon from './images/more-icon.svg';
import scrollbarSize from 'dom-helpers/util/scrollbarSize';


import {
  AutoSizer,
  ScrollSync,
  Grid,
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import { localClass, pagerContainer } from './VTable.scss';

let blinkInterval = null;

/*** 固定列必须带有宽度 ***/
class VirtualizedTable extends Component {

  static propTypes = {
    bordered: PropTypes.bool, //table风格
    columns: PropTypes.array, // 列配置 
    sortBy: PropTypes.string, // 列配置 
    sortOrder: PropTypes.oneOf(['ascend', 'descend', '']), // 列配置 
    dataSource: PropTypes.array,  // 数据源
    rowKey: PropTypes.func, //设置rowkey
    loading: PropTypes.bool, // 加载装 'pending', 'done', 'error'
    height: PropTypes.number, // 设置控件高度
    rowSelection:PropTypes.object, // 是否支持选中
    pagination:PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
    ]),  //分页参数
    emptyInfo:PropTypes.string, //空白占位控件参数
    hasButton:PropTypes.bool,  //空白占位控件参数
    buttonInfo:PropTypes.object, //空白占位控件参数

    fixedRowCount: PropTypes.number, // 固定行数
    headerHoverEnable: PropTypes.bool, // header是否支持hover选中列

    onHeaderCellClick: PropTypes.func, // 头部点击事件
    onBodyCellClick: PropTypes.func, // cell点击事件
    onBodyCellDoubleClick: PropTypes.func, // cell双击事件
    onRowClick: PropTypes.func, // 行点击事件
    onRowDoubleClick: PropTypes.func, // 行双击事件
    onCell: PropTypes.func, // 给body cell添加props
    onHeaderCell: PropTypes.func, // 给Header cell添加props
  }

  static defaultProps = {

  }
  constructor(props) {
    super(props);
    let defaultColumnWidth = 250;
    let columns = props.columns || [];
    if (props.rowSelection) {
      this.addCheckboxColumn(columns);
    }

    columns = this.addNavColumns(columns);

    this.state = {
      columns,
      height: _.get(props, 'height') || 0,
      overscanColumnCount: 2,
      overscanRowCount: 3,
      rowHeight: 40,
      fixedRowCount: props.fixedRowCount || 0,

      defaultColumnWidth,
    };

    this.centerHeaderRef = React.createRef();
    this.centerBodyRef = React.createRef();
    this.rootRef = React.createRef();

    this._renderBodyCell = this._renderBodyCell.bind(this);
    this._renderHeaderCell = this._renderHeaderCell.bind(this);
    this._renderLeftSideCell = this._renderLeftSideCell.bind(this);

    this._getColunmWidth = this._getColunmWidth.bind(this);
  }

  rowKey = (record) => {
    const { rowKey } = this.props;
    if (_.isFunction(rowKey)) {
      return rowKey(record);
    }

    return record.id;
  }

  addCheckboxColumn = (columns) => {

    if (columns[0] && columns[0].__columnType !== 'rowSelect') {
      columns.unshift({
        key: '',
        fixed: 'left',
        width: 40,
        __columnType: 'rowSelect',
        renderHeader: () => {
          const { rowSelection: { selectedRowKeys, getCheckboxProps } = {}, dataSource } = this.props;
          const checked = !_.isEmpty(selectedRowKeys) && selectedRowKeys.length === dataSource.length;
          let restProps = {};
          if (_.isFunction(getCheckboxProps)) {
            restProps = getCheckboxProps({});
          }
          return (
            <Checkbox
              checked={checked}
              {...restProps}
              onChange={this.handleToggleSelectAll}
              indeterminate={!checked && !_.isEmpty(selectedRowKeys)}
              className='abc-chk-all'>
            </Checkbox>
          )
        },
        render: (text, record, index) => {
          const { rowSelection: { selectedRowKeys, getCheckboxProps } = {} } = this.props;
          let restProps = {};
          if (_.isFunction(getCheckboxProps)) {
            restProps = getCheckboxProps(record);
          }
          
          return (
            <Checkbox
              dataref={record}
              {...restProps}
              onChange={this.handleToggleSelect}
              checked={_.indexOf(selectedRowKeys, this.rowKey(record)) >= 0}>
            </Checkbox>
          )
        }
      })
    }

    return columns;
  }

  hasNav = () => {
    let hasNav = false
    const { columns, defaultColumnWidth } = this.state;
    const allWidth = _.sumBy(columns, each => each.width || defaultColumnWidth);
    if (this.centerBodyRef.current) {
      const ele = this.centerBodyRef.current._scrollingContainer;

      if (ele && ele.clientWidth < allWidth) {
        hasNav = true;
      }
    }

    return hasNav;
  }

  // 增加向左，向右的列 
  addNavColumns = (columns) => {
    let leftFixedColumns = _.filter(columns, each => each.fixed === 'left') || [];
    let rightFixedColumns = _.filter(columns, each => each.fixed === 'right') || [];
    let cColumns = _.filter(columns, each => each.fixed !== 'right' && each.fixed !== 'left') || [];

    if (!leftFixedColumns.find(each => each.__columnType === 'leftNav')) {
      leftFixedColumns.push({
        key: 'leftNav',
        fixed: 'left',
        width: 20,
        __columnType: 'leftNav',
        renderHeader: () => {
          //如果没有出现水平滚动条 不渲染
          if (!this.hasNav()) {
            return <div className='nav-wrapper-empty'></div>;
          }
          return (
            <div className="nav-wrapper left-nav-wrapper" onClick={this.handleScrollLeft}>
              {/* <Icons type='left-arrow' /> */}
              <img src={leftArrow} alt='' style={{width:15}}/>
            </div>
          )
        },
      })
    }

    if (!rightFixedColumns.find(each => each.__columnType === 'rightNav')) {
      rightFixedColumns.unshift({
        key: 'rightNav',
        fixed: 'right',
        width: 20,
        __columnType: 'rightNav',
        renderHeader: () => {
          //如果没有出现水平滚动条 不渲染
          if (!this.hasNav()) {
            return <div className='nav-wrapper-empty'></div>;
          }
          return (
            <div className="nav-wrapper right-nav-wrapper" onClick={this.handleScrollRight}>
              {/* <Icons type='right-arrow' /> */}
              <img src={rightArrow} alt='' style={{width:15}} />
            </div>
          )
        },
      })
    }

    // 
    if (!_.isEmpty(columns)) {
      if (!columns.find(each => !each.width)) { //所有的列都设置了宽度 则将非固定列的最后一个宽置空
        _.last(cColumns).width = undefined;
      }
    }

    return leftFixedColumns.concat(cColumns, rightFixedColumns);
  }

  componentDidMount() {
   

  }

  componentDidUpdate(prevProps) {
    const { columns, loading, height } = this.props;
    if (loading !== prevProps.loading && !loading && this.centerBodyRef.current) {
      this.centerBodyRef.current.scrollToPosition({ scrollTop: 0 });
    }

    if (prevProps.height && prevProps.height !== height) {
      this.setState({
        height
      })
    }

    if (columns !== prevProps.columns) {
      if (this.props.rowSelection) {
        this.addCheckboxColumn(columns);
      }

      this.setState({
        columns: this.addNavColumns(columns)
      }, () => {
        this.reRenderColumns();
      });
    }
  }

  componentWillUnmount() {
    this.isUnmouting = true;
  }

  // 当列变化或者容器宽度变化时 动态计算列宽
  reRenderColumns = () => {
    const { columns } = this.state;
    columns.forEach((each, index) => {
      if (this.centerHeaderRef.current) {
        this.centerHeaderRef.current.recomputeGridSize({ columnIndex: index })
        this.centerBodyRef.current.recomputeGridSize({ columnIndex: index });
      }
    })
  }

  handleResize = () => {
    const { columns } = this.state;
    this.setState({
      columns: this.addNavColumns(columns)
    }, () => {
      this.reRenderColumns();
    })
  }

  debouncedResize = _.debounce(this.handleResize, 200, {
    leading: true,
  });

  // options:{rowIndex, key, columnIndex}
  handleHeaderCellClick = (col, options = {}, extraProps, ...restArgs) => {
    const { onHeaderCellClick } = this.props;
    if (_.isFunction(onHeaderCellClick)) {
      onHeaderCellClick(col, options, ...restArgs);
    }

    if (_.isFunction(extraProps.onClick)) {
      extraProps.onClick(col, options, ...restArgs);
    }
  }

  handleBodyCellMouseEnter = (row, options= {}, extraProps={}, ...restArgs) => {
    const { hoverRowIndex } = this.state;
    if (hoverRowIndex !== options.rowIndex) {
      this.setState({
        hoverRowIndex: options.rowIndex,
        hoverColumnKey: null,
      })

      this.reRenderColumns();
    }

    if (_.isFunction(extraProps.onMouseEnter)) {
      extraProps.onMouseEnter(row, options, ...restArgs);
    }
  }

  // options:{rowIndex, key, columnIndex, column}
  handleBodyCellClick = (rowData, options={}, extraProps= {}, ...restArgs) => {
    const { onBodyCellClick, onRowClick } = this.props;
    const { selectedRowData = {} } = this.state;
    if (_.isFunction(onBodyCellClick)) {
      onBodyCellClick(rowData, options)
    }

    if (_.isFunction(extraProps.onClick)) {
      extraProps.onClick(rowData, options, ...restArgs);
    }

    // 点击rowSelection列 不触发rowClick事件
    if (_.isFunction(onRowClick)) {
      if (options.column.__columnType !== 'rowSelect') {
        onRowClick(rowData, options)
      }
    }

    if (selectedRowData.rowIndex !== options.rowIndex) {
      this.setState({
        selectedRowData: {
          rowData,
          ...options
        }
      })
      this.reRenderColumns();
    }

  }

  handleBodyCellDBClick = (rowData, options={}, extraProps, ...restArgs) => {
    const { onBodyCellDoubleClick, onRowDoubleClick } = this.props;
    const { selectedRowData = {} } = this.state;
    if (_.isFunction(onBodyCellDoubleClick)) {
      onBodyCellDoubleClick(rowData, options)
    }

    if (_.isFunction(extraProps.onDoubleClick)) {
      extraProps.onDoubleClick(rowData, options, ...restArgs);
    }

    // 点击rowSelection列 不触发rowClick事件
    if (_.isFunction(onRowDoubleClick)) {
      if (options.column.__columnType !== 'rowSelect') {
        onRowDoubleClick(rowData, options)
      }
    }

    if (selectedRowData.rowIndex === options.rowIndex) {
      return;
    }

    this.setState({
      selectedRowData: {
        rowData,
        ...options
      }
    })

    this.reRenderColumns();
  }

  handleHeaderCellMouseEnter = (col, extraProps, ...restArgs) => {
    if (_.isFunction(extraProps.onMouseEnter)) {
      extraProps.onMouseEnter(col, ...restArgs);
    }

    let xKey = col.key;
    if (!col || col.key === 'rightNav' || col.key === 'leftNav') {
      xKey = null;
    }
    this.setState({
      hoverColumnKey: xKey,
      hoverRowIndex: null
    })

    this.reRenderColumns();
  }

  handleHeaderMouseLeave = () => {
    // const { headerHoverEnable } = this.props;
    // if (!headerHoverEnable) {
    //   return;
    // }

    this.setState({
      hoverColumnKey: null,  
      hoverRowIndex: null //兼容fixedRowCount!==0 的情况
    })

    this.reRenderColumns();
  }

  handleBodyMouseLeave = () => {
    this.setState({
      hoverRowIndex: null
    })

    this.reRenderColumns();
  }

  handleScrollLeft = () => {
    const { leftFixedColumns } = this.resolveColumns();
    const { columns, defaultColumnWidth } = this.state;

    const leftWidth = _.sumBy(leftFixedColumns, 'width');
    if (!this.centerHeaderRef.current || !this.centerBodyRef.current || !this.rootRef.current) {
      return;
    }

    let nextLeft = 0;
    let sumWidth = 0;
    const { state: { scrollLeft } = {} } = this.centerHeaderRef.current;

    for (let i = 0; i < columns.length; i++) {
      let xCol = columns[i];
      let width = xCol.width || defaultColumnWidth;
      sumWidth += width;
      
      // 找到当前滚动在最左侧的列
      if (scrollLeft > sumWidth - leftWidth && scrollLeft <= sumWidth + width - leftWidth) {
        nextLeft = sumWidth - leftWidth;
        break;
      }
    }

    if (nextLeft < 0) {
      nextLeft = 0;
    }

    this.centerBodyRef.current.scrollToPosition({ scrollLeft: nextLeft });
  }

  handleScrollRight = () => {
    const { columns, defaultColumnWidth } = this.state;
    const { dataSource = [] } = this.props;
    const { rightFixedColumns } = this.resolveColumns();

    const rightWidth = _.sumBy(rightFixedColumns, each => each.width || defaultColumnWidth);
    if (!this.centerHeaderRef.current || !this.centerBodyRef.current || !this.rootRef.current) {
      return;
    }

    let scrollLeft = this.centerBodyRef.current.state.scrollLeft;

    let bodyContainer = _.get(this.centerBodyRef.current, '_scrollingContainer');
    let headerContainer = _.get(this.centerHeaderRef.current, '_scrollingContainer');

    let nextLeft = 0;
    
    let sumWidth = 0;
    let xIndex = -1;

    for (let i = 0; i < columns.length; i++) {
      let tWidth = columns[i].width || defaultColumnWidth;
      if (sumWidth + tWidth - scrollLeft >= this.allWidth - rightWidth) {
        xIndex = i;
        break;
      }

      sumWidth += tWidth;
    }

    if (xIndex === -1) {
      return ;
    }

    let left = sumWidth;
    let width = columns[xIndex].width || defaultColumnWidth;

    var p = this._getClientWidth() - width;

    nextLeft = left - p + rightWidth;
    let scrollWidth = bodyContainer.scrollWidth;
    let clientWidth = bodyContainer.clientWidth;

    if (_.isEmpty(dataSource)) {
      scrollWidth =_.sumBy(columns, each => each.width || defaultColumnWidth);
      clientWidth = headerContainer.clientWidth;

      if (scrollWidth < clientWidth) {
        scrollWidth = clientWidth;
      }
    }

    if (nextLeft > scrollWidth - clientWidth) {
      nextLeft = scrollWidth - clientWidth;
    }

    this.centerBodyRef.current.scrollToPosition({ scrollLeft: nextLeft });
  }

  scrollToColumn = (col) => {
    let left = 0;
    const { columns, defaultColumnWidth } = this.state;
    const { leftFixedColumns } = this.resolveColumns();
    const leftWidth = _.sumBy(leftFixedColumns, 'width');

    const minWidth = _.sumBy(columns, each => each.width || defaultColumnWidth);
    const clientWidth = this._getClientWidth();

    for (let i = 0; i < columns.length; i++) {
      let xCol = columns[i];

      if (xCol.key === col.key) {
        break;
      }

      left += xCol.width;
    }

    this.setState({
      blinkColumnKey: col.key,
    }, () => {
      if (blinkInterval) {
        window.clearTimeout(blinkInterval);
      }

      blinkInterval = window.setTimeout(() => {
        if (this.isUnmouting) {
          return;
        }

        this.setState({blinkColumnKey: null})
      }, 1800)

    })
    this.reRenderColumns();

    // 如果没有滚动条 则不滚动
    if (minWidth <= clientWidth) {
      return;
    }

    left = left - leftWidth;

    if (left >= minWidth - clientWidth) {
      left = minWidth - clientWidth;
    } else if (left < 0) {
      left = 0;
    }

    this.centerBodyRef.current.scrollToPosition({ scrollLeft: left });
  }

  scrollToRow = (rowIndex) => {
    this.centerBodyRef.current.scrollToCell({ rowIndex });
  }

  render() {
    const {
      height,
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      fixedRowCount
    } = this.state;
    const { dataSource, pagination, loading, emptyInfo, hasButton, buttonInfo, bordered } = this.props;
    let rowCount = dataSource.length;
    let headRowCount = 1 + fixedRowCount;
    const {
      columnCount,
    } = this.resolveColumns();

    let bodyContainer = _.get(this.centerBodyRef.current, '_scrollingContainer');
   
    let hasVerticalScrollBar = height < rowHeight * rowCount;

    if (bodyContainer) {
      hasVerticalScrollBar = bodyContainer.scrollHeight > bodyContainer.clientHeight;
    }

    return (
      <React.Fragment>
        <ScrollSync className={localClass}>
          {({
            clientHeight,
            clientWidth,
            onScroll,
            scrollHeight,
            scrollLeft,
            scrollTop,
            scrollWidth,
          }) => {
            return (
              <React.Fragment>
                <div ref={this.rootRef} className={cn('GridRow', localClass, {bordered})}>

                  <div className={'GridColumn'}>
                    <AutoSizer onResize={this.debouncedResize} disableHeight>
                      {({ width }) => {
                        this.allWidth = width;
                        return (
                          <div style={{
                            height: height + rowHeight
                          }}>
                            <div
                              onMouseLeave={this.handleHeaderMouseLeave}
                              style={{
                                height: rowHeight * headRowCount,
                                width: this._getClientWidth(),
                              }}>
                              <Grid
                                className={'HeaderGrid'}
                                ref={this.centerHeaderRef}
                                columnWidth={this._getColunmWidth}
                                columnCount={columnCount}
                                height={rowHeight * headRowCount}
                                overscanColumnCount={overscanColumnCount}
                                cellRenderer={this._renderHeaderCell}
                                cellRangeRenderer={this._cellRangeRenderer.bind(this, 'header')}
                                rowHeight={rowHeight}
                                rowCount={headRowCount}
                                scrollLeft={scrollLeft}
                                width={this._getClientWidth()}
                              />
                            </div>
                            <div
                              onMouseLeave={this.handleBodyMouseLeave}
                              style={{
                                // height: height - fixedRowCount * rowHeight,
                                height: this._getBodyHeight(height, fixedRowCount, rowHeight),
                                width,
                              }}>
                              <Grid
                                className={'BodyGrid'}
                                ref={this.centerBodyRef}
                                columnWidth={this._getColunmWidth}
                                columnCount={columnCount}
                                height={this._getBodyHeight(height, fixedRowCount, rowHeight)}
                                cellRangeRenderer={this._cellRangeRenderer.bind(this, 'body')}
                                overscanColumnCount={overscanColumnCount}
                                overscanRowCount={overscanRowCount}
                                cellRenderer={this._renderBodyCell}
                                onScroll={onScroll}
                                rowHeight={rowHeight}
                                rowCount={this.getRowCount(rowCount, fixedRowCount)}
                                width={hasVerticalScrollBar ? width : this._getClientWidth()}
                              />
                            </div>
                          </div>
                        )
                      }}
                    </AutoSizer>
                  </div>


                  {
                    loading &&
                    <React.Fragment>
                      <div className='loading-mask' style={{}}>
                      </div>
                      <Loading />
                    </React.Fragment>
                  }
                  {
                    !loading && _.isEmpty(dataSource) &&
                    <EmptyHolder
                      placeholder={emptyInfo || '暂无数据'}
                      hasButton={hasButton}
                      buttonInfo={buttonInfo}
                    />
                  }
                </div>
              </React.Fragment>
            );
          }}
        </ScrollSync>

        {!_.isEmpty(dataSource) && pagination &&
          <div className={pagerContainer}>
            <Pagination
              style={{
                float: 'right',
                padding: '15px 20px',
                fontSize: '12px'
              }}
              {...pagination}
              itemRender={(page, type, originalElement) => {
                if (type === "prev") {
                  return <Button>上一页</Button>;
                }
                if (type === "next") {
                  return <Button>下一页</Button>;
                }
                return originalElement;
              }}
              total={pagination.total} />
          </div>
        }
      </React.Fragment>
    );
  }

  _getBodyHeight = (height, fixedRowCount, rowHeight) => {
    // const { dataSource = [] } = this.props;
    // let currHeight = dataSource.length * rowHeight;

    // if (currHeight < height) {
    //   height = currHeight;
    // }

    let p = height - fixedRowCount * rowHeight;
    return p > 0 ? p : 0;
  }

  resolveColumns = () => {
    const { columns } = this.state;
    let columnCount = columns.length;
    let leftFixedColumns = _.filter(columns, each => each.fixed === 'left') || [];
    let rightFixedColumns = _.filter(columns, each => each.fixed === 'right') || [];

    return {
      columnCount,
      leftFixedColumns,
      rightFixedColumns
    }
  }

  handleSorterClick = (col, evt) => {
    let { onSort, sortBy, sortOrder } = this.props;
    if(evt && _.isFunction(evt.preventDefault)) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    if (sortBy === col.key) {
      sortOrder = sortOrder === 'descend' ? 'ascend' : 'descend';
    } else {
      sortBy = col.key;
      sortOrder = 'descend';
    }

    if (_.isFunction(onSort)) {
      onSort({sortBy, sortOrder});
    }
  }

  _getClientWidth = () => {
    return this.allWidth - scrollbarSize();
  }

  // 计算动态列宽
  _getColunmWidth({ index }) {
    const { columns, defaultColumnWidth } = this.state;

    let rWidth = +_.get(columns[index], 'width');
    if (rWidth) {
      return rWidth;
    }

    var xCount = _.countBy(columns, each => !each.width); // 没有设置width的列数量
    var xW = _.sumBy(columns, 'width'); // 已经设置列宽的总宽度
    var dWidth = this._getClientWidth() - xW; // 剩余的宽度
    var temp = dWidth / xCount.true;// 平均宽度

    return temp < defaultColumnWidth ? defaultColumnWidth : temp;
  }

  _renderBodyCell({ columnIndex, key, rowIndex, style}) {
    return this._renderLeftSideCell({ columnIndex, key, rowIndex, style });
  }

  _renderHeaderCell({ columnIndex, key, rowIndex, style }) {
    return this._renderLeftHeaderCell({ columnIndex, key, rowIndex, style });
  }

  // 最终执行head cell渲染的函数
  _renderLeftHeaderCell = ({ columnIndex, key, style, rowIndex }) => {
    const { fixedRowCount, hoverColumnKey, blinkColumnKey } = this.state;
    if (rowIndex !== 0) {
      return this._renderLeftSideCell({ columnIndex, key, style, rowIndex: rowIndex - 1 - fixedRowCount }); // rowIndex 负补偿
    }

    const { columns } = this.state;
    const { renderHeaderMoreOptions, onHeaderCell, sortOrder, sortBy } = this.props;
    const { columnCount, rightFixedColumns } = this.resolveColumns();


    let xCol = columns[columnIndex] || {};
    let extraProps = {};
    if (_.isFunction(onHeaderCell)) {
      extraProps = onHeaderCell(xCol,  {columnIndex, key, rowIndex}) || {};
    }

    let { onMouseEnter, onClick, className, columnindex, key:x, style: extraStyle, ...restExtraProps } = extraProps;

    let menu = null;
    if (_.isFunction(renderHeaderMoreOptions)) {
      menu = renderHeaderMoreOptions(xCol);
    }

    return (
      <div
        onMouseEnter={this.handleHeaderCellMouseEnter.bind(this, xCol, {columnIndex, key, rowIndex}, extraProps)}
        onClick={this.handleHeaderCellClick.bind(this, xCol, {columnIndex, key, rowIndex}, extraProps)}
        className={cn('headerCell', `headerCell-${columnIndex}`, className, {
          columnHover: xCol.key === hoverColumnKey,
          blinkCell: xCol.key === blinkColumnKey,
          fixed: xCol.fixed,
          lastNonFixed: columnCount - rightFixedColumns.length === columnIndex + 1
        })}
        columnindex={columnIndex}
        key={key}
        style={{ ...style, textAlign: xCol.textAlign || 'left', ...extraStyle }} {...restExtraProps}>
        {
          _.isFunction(xCol.renderHeader) ? xCol.renderHeader(xCol.title, xCol, columnIndex)
            : (
              <div className='header-cell-container'>
                <div className='header-title clearfix' title={xCol.title || ''}>
                  <span className='header-title-text'>
                    {this._renderHeaderTitle(xCol)}
                  </span>
                  {
                    xCol.sorter &&
                    <Sorter 
                      onClick={this.handleSorterClick.bind(this, xCol)} 
                      className='header-sorter' sortOrder={ xCol.key === sortBy ? (sortOrder || 'descend') : '' } />
                  }
                </div>
               
              {
                !_.isEmpty(menu) &&
                <div className='header-more' onClick={this._cancelEvent}>
                  <Dropdown 
                    trigger={['hover']} overlay={menu} placement="bottomRight">
                    <div className='sort-wrapper'>
                      <img src={moreIcon} alt='' style={{width: 10}} />
                      {/* <OnlineSvg type='icon-more'/> */}
                    </div>
                  </Dropdown>
                </div>
              }
              
            </div>
          )
        }
      </div>
    );
  }

  
  // 最终执行body cell渲染的函数
  _renderLeftSideCell({ columnIndex, key, rowIndex, style }) {
    const { dataSource, bordered, rowClassName, onCell } = this.props;
    const { columns, fixedRowCount, hoverColumnKey, hoverRowIndex, blinkColumnKey, selectedRowData = {} } = this.state;
    const { columnCount, rightFixedColumns } = this.resolveColumns();

    rowIndex = rowIndex + fixedRowCount;
    if (rowIndex <= 0) {
      rowIndex = 0;
    }

    const xRow = dataSource[rowIndex] || {};
    const xCol = columns[columnIndex] || {};
    const text = _.get(xRow, `${xCol.key}`);

    const rowClass =
      rowIndex % 2 === 0 ? 'oddRow' : 'evenRow'
    const classNames = cn(rowClass, 'cell', `cell-${rowIndex}`, `column-${columnIndex}`, {
      fixed: !!xCol.fixed,
      rowClassName,
      columnHover: xCol.key === hoverColumnKey,
      blinkCell: xCol.key === blinkColumnKey,
      rowActive: hoverRowIndex === rowIndex,
      cellBordered: bordered,
      cellLeftNav: xCol.key === 'leftNav',
      cellRightNav: xCol.key === 'rightNav',
      navCell: xCol.key === 'rightNav' ||  xCol.key === 'leftNav',
      rowSelected: selectedRowData.rowIndex === rowIndex,
      lastNonFixed: columnCount - rightFixedColumns.length === columnIndex + 1
    });

    if (xCol.__columnType === 'rowSelect') {
      style ={...style};
      style.textAlign = 'center';
    }

    let extraProps = {};
    if (_.isFunction(onCell)) {
      extraProps = onCell(xRow, {columnIndex, key, rowIndex, column: xCol}) || {};
    }

    let { onMouseEnter, onClick, onDoubleClick, className, key:x, style:extraStyle, ...restExtraProps } = extraProps;

    return (
      <div className={classNames} key={key}
        onMouseEnter={this.handleBodyCellMouseEnter.bind(this, xRow, {columnIndex, key, rowIndex, column: xCol}, extraProps)} 
        onClick={this.handleBodyCellClick.bind(this, xRow, {columnIndex, key, rowIndex, column: xCol}, extraProps)} 
        onDoubleClick={this.handleBodyCellDBClick.bind(this, xRow, {columnIndex, key, rowIndex, column: xCol}, extraProps)} 
        style={{  textAlign: xCol.textAlign || 'left', ...style, ...extraStyle }} {...restExtraProps}>
        <div className='cell-container'>
          {_.isFunction(xCol.render) ? xCol.render(text, xRow, columnIndex) : text}
        </div>
      </div>
    );
  }

  _renderHeaderTitle = (xCol) => {
    if (_.isFunction(xCol.renderHeaderTitle)) {
      return xCol.renderHeaderTitle(xCol);
    }

    return xCol.title || xCol.key || '--';
  }

  getRowCount = (rowCount, fixedRowCount) => {
    let temp = rowCount - fixedRowCount;
    return temp > 0 ? temp : 0;
  }


  //2种方式更新checkbox状态 一种是通过js控制每个控件的状态 另外一种是通过rerender重新刷新表控件
  handleToggleSelectAll = (evt) => {
    let { dataSource, rowSelection: { selectedRowKeys = [], onChange } = {} } = this.props;
    if (_.isEmpty(dataSource)) {
      return;
    }

    if (selectedRowKeys.length === dataSource.length) {
      selectedRowKeys.length = 0; // 清空
    } else {
      selectedRowKeys.length = 0;
      // 添加
      dataSource.map(each => this.rowKey(each)).forEach(each => {
        selectedRowKeys.push(each);
      })
    }

    if (_.isFunction(onChange)) {
      onChange(selectedRowKeys);
    }
  }

  handleToggleSelect = (evt) => {
    const dataref = evt.target.dataref || {};
    const id = this.rowKey(dataref);

    let { rowSelection: { selectedRowKeys = [], onChange } = {} } = this.props;
    let index = _.findIndex(selectedRowKeys, each => each === id)

     if (index === -1) {
      selectedRowKeys.push(id);
    } else {
      selectedRowKeys.splice(index, 1);
    }

    if (_.isFunction(onChange)) {
      onChange(selectedRowKeys);
    }
  }

  _cancelEvent = (evt) => {
    if (evt && _.isFunction(evt.preventDefault)) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  _cellRangeRenderer = (placement, {
    cellCache,                    // Temporary cell cache used while scrolling
    cellRenderer,                 // Cell renderer prop supplied to Grid
    columnSizeAndPositionManager, // @see CellSizeAndPositionManager,
    columnStartIndex,             // Index of first column (inclusive) to render
    columnStopIndex,              // Index of last column (inclusive) to render
    horizontalOffsetAdjustment,   // Horizontal pixel offset (required for scaling)
    isScrolling,                  // The Grid is currently being scrolled
    rowSizeAndPositionManager,    // @see CellSizeAndPositionManager,
    rowStartIndex,                // Index of first row (inclusive) to render
    rowStopIndex,                 // Index of last row (inclusive) to render
    scrollLeft,                   // Current horizontal scroll offset of Grid
    scrollTop,                    // Current vertical scroll offset of Grid
    styleCache,                   // Temporary style (size & position) cache used while scrolling
    verticalOffsetAdjustment,      // Vertical pixel offset (required for scaling)
  }) => {
    const { columns, defaultColumnWidth } = this.state;
    const { dataSource } = this.props;
    const leftSideCells = [];
    const rightSideCells = [];
    const bodyCells = [];

    let leftSideColunms = _.filter(columns, col => col.fixed === 'left');
    let rightSideColunms = _.filter(columns, col => col.fixed === 'right');

    let leftSideWidth = _.sumBy(leftSideColunms, (col) => col.width || defaultColumnWidth);
    let rightSideWidth = _.sumBy(rightSideColunms, (col) => col.width || defaultColumnWidth);
    let scrollWidth = _.sumBy(columns, (col) => col.width || defaultColumnWidth);
    let clientWidth = this._getClientWidth();//headerContainer.clientWidth;
    // let scrollContainer = null;

    // if (placement === 'header') {
    //   scrollContainer = _.get(this.centerBodyRef.current, '_scrollingContainer');
    // } else {
    //   scrollContainer = _.get(this.centerHeaderRef.current, '_scrollingContainer');
    // }

    if (scrollWidth < clientWidth) {
      scrollWidth = clientWidth;
    }

    let deltaWidth = scrollWidth - clientWidth;
    if (deltaWidth < 0) {
      deltaWidth = 0;
    }

    if (scrollLeft > deltaWidth) {
      scrollLeft = deltaWidth;
    }



    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      let rowDatum = rowSizeAndPositionManager.getSizeAndPositionOfCell(rowIndex)
  
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        let columnDatum = columnSizeAndPositionManager.getSizeAndPositionOfCell(columnIndex)

        // 超出范围的列 需要重新计算
        if ((columnIndex < columnStartIndex && !columns[columnIndex].fixed )
          || (columnIndex > columnStopIndex && !columns[columnIndex].fixed )) {

          // 如果数据源不为空 则不渲染该列
          if (!_.isEmpty(dataSource)) {
            continue;
          }

          // 超出视口范围的列 不渲染
          if (columnDatum.offset - scrollLeft > this.allWidth || columnDatum.offset - scrollLeft + columnDatum.size < 0) {
            continue;
          }
        }
  
  
        let left = undefined;
        let fixed = _.get(columns[columnIndex], 'fixed');

       

        let top = rowDatum.offset + verticalOffsetAdjustment
  
        let key = `${rowIndex}-${columnIndex}`
        let height = rowDatum.size
        let width = columnDatum.size

        let style = {
          height,
          width,
          left,
          top,
          position: 'absolute'
        }

        if (fixed === 'left') {
          style.left = columnDatum.offset + horizontalOffsetAdjustment;
          leftSideCells.push(cellRenderer({columnIndex, key, style, rowIndex}));
        } else if (fixed === 'right') { // 需要计算右边
          style.left = columnDatum.offset + horizontalOffsetAdjustment - (scrollWidth - rightSideWidth);
          rightSideCells.push(cellRenderer({columnIndex, key, style, rowIndex}));
        } else {
          style.left = columnDatum.offset + horizontalOffsetAdjustment;
          bodyCells.push(cellRenderer({columnIndex, key, style, rowIndex}));
        }
      }
    }

    return [(
      <React.Fragment key='sticky-scroll-wrapper'>
        <div key='left-side-container' style={{width: leftSideWidth, height: '100%', position: 'sticky', float: 'left', display: 'inline-block', zIndex: 3, top:0, left: '0px'}}>
          <div style={{position: 'relative'}}>
          {leftSideCells}
          </div>
        </div>
        <div key='body-content-container' style={{width: clientWidth - (leftSideWidth + rightSideWidth), height: '100%',  float: 'left',display: 'inline-block' }}>
          {bodyCells}
        </div>
        <div key='right-side-container' style={{width: rightSideWidth, height: '100%', position: 'sticky', float: 'left', display: 'inline-block', left: clientWidth - rightSideWidth}}>
          <div style={{position: 'relative'}}>
            {rightSideCells}
          </div>
        </div>
      </React.Fragment>
    )]
  }
}

export default VirtualizedTable;
