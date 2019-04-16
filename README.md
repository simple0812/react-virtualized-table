- 左右固定列
- 支持固定行
- 排序
- 支持批量选择
- 支持分页
- 头部支持更多操作
- 头部支持左右滚动
- 使用react-virtualized实现虚拟加载

```
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
```

```
import React, {
  Component
} from 'react';
import _ from 'lodash';
import { Menu } from 'antd';

import VirtualizedTable from '../components/Table/VTable.sticky';


class DemoPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRowKeys: [],
      pageConditions: {
        limit: 1000,
        offset: 0,
      },
      dataSource: []
    }

    this.columns = [
      { key: 'id', title: '编号', width: 100, fixed: 'left'}, 
      { key: 'name', title: '名称',width: 150,  sorter: true}, 
      { key: 'de', title: '描述', width: 150, sorter: true}, 
      { key: 'at', title: 'at', renderHeader: (title, col, columnIndex) => `${title}-${columnIndex}` }, 
      { key: 'bt', title: 'bt', renderHeaderTitle: (col) => col.title + '___x'  }, 
      { key: 'ct', title: '', render: (text, row, columnIndex) => `${text}-${columnIndex}`  }, 
      { key: 'dt', title: '',  }, 
      { key: 'et', title: '',  }, 
      { key: 'ft', title: '',  }, 
      { key: 'gt', title: '',  }, 
      { key: 'ht', title: '',  }, 
      { key: 'it', title: '',  }, 
      { key: 'jt', title: '',  }, 
      { key: 'kt', title: '',  }, 
      { key: 'lt', title: '',  }, 
      { key: 'mt', title: '',  }, 
      { key: 'nt', title: '',  }, 
      { key: 'ot', title: '',  }, 
      { key: 'pt', title: '',  }, 
      { key: 'qt', title: '',  }, 
      { key: 'rt', title: '',  }, 
      { key: 'st', title: '',  }, 
      { key: 'tt', title: '',  fixed: 'right', width: 150,},
    ];

  }

  componentDidMount() {
    this.mockData();
  }

  fetchData = (newState) => {
    const nextState = _.assign(this.state, newState);

    const { pageConditions } = nextState;

    const params = _.cloneDeep(pageConditions);

    this.setState({
      ...newState,
      selectedRowKeys: [] //清空选中
    });

    this.props.tableStore.fetchTableData(params);
  }


  mockData = (newState) => {
    const nextState = _.assign(this.state, newState);

    const { pageConditions: {limit, offset} ={}} = nextState;

    let dataSource = _.range(offset, offset + limit).map(each => {
      return {
        id: 'id' + (each),
        name: 'name' + each,
        de: 'desc' + each,
        at: 'a' + each,
        bt: 'b' + each,
        ct: 'c' + each,
        et: 'e' + each,
        ft: 'f' + each,
        gt: 'g' + each,
        ht: 'h' + each,
        it: 'i' + each,
        jt: 'j' + each,
        kt: 'k' + each,
        lt: 'l' + each,
        mt: 'm' + each,
        nt: 'n' + each,
        ot: 'o' + each,
        pt: 'p' + each,
        qt: 'q' + each,
        rt: 'r' + each,
        st: 's' + each,
        tt: 't' + each,
      }
    })

    this.setState({
      ...newState,
      dataSource,
      selectedRowKeys: [] //清空选中
    });
  }

  handlePageSizeChange = (page, size) => {
    const { pageConditions } = this.state;
    pageConditions.limit = size;
    pageConditions.offset = 0;

    this.mockData({
      pageConditions,
    });
  }

  getConfig = () => {
    const { sortOrder, sortBy, pageConditions } = this.state;
    return {
      pagination: {
        hideOnSinglePage: false,
        total: 100000,
        showTotal: total => `共 ${total} 条`,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSize: pageConditions.limit,
        pageSizeOptions: ['200', '500', '800', '1000'],
        onShowSizeChange: this.handlePageSizeChange,
        onChange: (current) => {
          pageConditions.offset = (current - 1) * pageConditions.limit;
          this.mockData({pageConditions})
        },
      },
      rowKey: (record) => record.id,
      
      fixedRowCount:2,
      headerHoverEnable: true,
      // bordered:true,
      rowSelection: {
        fixed: true,
        getCheckboxProps: (record) => {
          return {
          }
        },
        selectedRowKeys: this.state.selectedRowKeys,
        onChange: (selectedRowKeys, selectedRows) => {
          this.setState({ selectedRowKeys });
        },
      },
      sortOrder,
      sortBy,
      onSort:({sortBy, sortOrder}) => {
        console.log('onsort', sortBy, sortOrder);
        this.setState({
          sortBy,
          sortOrder
        })
      },
      onRowClick: (row) => {
        console.log('onRowClick', row)
      },
      onRowDoubleClick: (row) => {
        console.log('onRowDoubleClick', row)
      },
      onCell:(row) => {
        return {}
      },
      onHeaderCell:(row) => {
        return {}
      },
    }
  }

  render() {
    return ( 
      <VirtualizedTable 
        {...this.getConfig()}
        height={500}
        columns={this.columns}
        renderHeaderMoreOptions={(col) => {
          return (
            <Menu className='abc-12-menu'>
              <Menu.Item>
                <span>编辑(当前页面)</span>
              </Menu.Item>
              <Menu.Item >
                <span>编辑(全部)</span>
              </Menu.Item>
              <Menu.Item >
                <span>{col.lock ? '解除锁定' : '锁定'}</span>
              </Menu.Item>
              <Menu.Divider></Menu.Divider>
              <Menu.Item>
                <span>隐藏</span>
              </Menu.Item>
            </Menu>
          )
        }}
        dataSource={this.state.dataSource}
      />
    );
  }
  }

  export default DemoPage;
```