## 初始化

```js
import * as LC from 'leancloud-storage';

const app = new LC.App({
  appId: '...',
  appKey: '...',
  serverURL: '...',
});

const db = app.storage();
```

## 保存对象

```js
const Todo = db.Class('Todo');

Todo.add({
  title: '马拉松报名',
});
```

## 获取对象

```js
Todo.object('5ee718799cba770009d7f856')
  .get()
  .then((todo) => {});
```

## 更新对象

```js
Todo.object('5ee718799cba770009d7f856').set({
  title: '取消马拉松',
});
```

### 更新计数器

```js
Todo.object('5ee718799cba770009d7f856').set({
  likes: LC.Storage.Value.increment(1),
});
```

### 更新数组

```js
const alarm1 = new Date('2018-04-30T07:10:00');
const alarm2 = new Date('2018-04-30T07:20:00');
const alarm3 = new Date('2018-04-30T07:30:00');

const alarms = [alarm1, alarm2, alarm3];

Todo.object('5ee718799cba770009d7f856').set({
  alarms: LC.Storage.Value.add(alarms),
});
```

## 删除对象

```js
Todo.object('5ee718799cba770009d7f856').delete();
```
