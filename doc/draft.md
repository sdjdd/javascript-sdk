# 数据存储开发指南 · JavaScript

## 对象

### LCObject

`LCObject` 是 LeanCloud 对复杂对象的封装，每个 `LCObject` 包含若干与 JSON 格式兼容的属性值对（也称键值对，key-value pairs）。这个数据是无模式化的（schema free），意味着你不需要提前标注每个 `LCObject` 上有哪些 key，你只需要随意设置键值对就可以，云端会保存它。 +

比如说，一个保存着单个 Todo 的 `LCObject` 可能包含如下数据：

```
title:      "给小林发邮件确认会议时间",
isComplete: false,
priority:   2,
tags:       ["工作", "销售"]
```

### 数据类型

`LCObject` 支持的数据类型包括 `String`、`Number`、`Boolean`、`Object`、`Array`、`Date`、`null` 等等。你可以通过嵌套的方式在 `Object` 或 `Array` 里面存储更加结构化的数据。

`LCObject` 还支持两种特殊的数据类型 `Pointer` 和 `File`，可以分别用来存储指向其他 `LCObject` 的指针以及二进制数据。

`LCObject` 同时支持 `GeoPoint`，可以用来存储地理位置信息。参见 [GeoPoint](#TODO)。

以下是一些示例：

```js
import { storage } from 'leancloud';

// 基本类型
const bool = true;
const number = 2018;
const string = `${number} 流行音乐榜单`;
const date = new Date();
const array = [string, number];
const object = {
  number: number,
  string: string,
};

// 构建对象
const Test = storage.class('Test');
const test = Test.add({
  testNumber: number,
  testString: string,
  testDate: date,
  testArray: array,
  testObject: object,
});
```

我们不推荐在 `LCObject` 里面存储图片、文档等大型二进制数据。每个 `LCObject` 的大小不能超过 **128 KB**。如需存储大型文件，可创建 File 实例并将将其关联到 AV.Object 的某个属性上。参见 [文件](#TODO)。

> 注意：时间类型在云端将会以 UTC 时间格式存储，但是客户端在读取之后会转化成本地时间。
>
> **控制台** > **存储** > **结构化数据** 中展示的日期数据也会依据操作系统的时区进行转换。一个例外是当你通过 REST API 获得数据时，这些数据将以 UTC 呈现。你可以手动对它们进行转换。

若想了解 LeanCloud 是如何保护应用数据的，请阅读 [数据和安全](#TODO)。

### 构建对象

下面的代码构建了一个 className 为 `Todo` Class：

```js
const Todo = storage.class('Todo');
```

<!-- TODO -->

你可以将 LeanCloud 里面的 class 比作关系型数据库里面的表。一个 class 的名字必须以字母开头，且只能包含数字、字母和下划线。

### 保存对象

下面的代码将一个 class 为 `Todo` 的对象存入云端：

```js
// 声明 class
const Todo = storage.class('Todo');

// 保存数据到云端
Todo.add({
  title: '马拉松报名',
  priority: 2,
})
  .then(() => {
    console.log(`保存成功, objectId: ${todo.objectId}`);
  })
  .catch((error) => {
    // 异常处理
  });
```

为了确认对象已经保存成功，我们可以到 **控制台** > **存储** > **结构化数据** > `Todo` 里面看一下，应该会有一行新的数据产生。点一下这个数据的 `objectId`，应该能看到类似这样的内容：

```json
{
  "title": "马拉松报名",
  "priority": 2,
  "ACL": {
    "*": {
      "read": true,
      "write": true
    }
  },
  "objectId": "582570f38ac247004f39c24b",
  "createdAt": "2017-11-11T07:19:15.549Z",
  "updatedAt": "2017-11-11T07:19:15.549Z"
}
```

> 无需在 **控制台** > **存储** > **结构化数据** 里面创建新的 Todo class 即可运行前面的代码。如果 class 不存在，它将自动创建。

以下是一些对象的内置属性，会在对象保存时自动创建，无需手动指定：

| 内置属性    | 类型     | 描述                                                           |
| ----------- | -------- | -------------------------------------------------------------- |
| `objectId`  | `string` | 该对象唯一的 ID 标识。                                         |
| `ACL`       | `ACL`    | 该对象的权限控制，实际上是一个 JSON 对象，控制台做了展现优化。 |
| `createdAt` | `Date`   | 该对象被创建的时间                                             |
| `updatedAt` | `Date`   | 该对象最后一次被修改的时间                                     |

这些属性的值会在对象被存入云端时自动填入，代码中尚未保存的 `LCObject` 不存在这些属性。

属性名（**keys**）只能包含字母、数字和下划线。自定义属性不得以双下划线（`__`）开头或与任何系统保留字段和内置属性（`ACL`、`className`、`createdAt`、`objectId` 和 `updatedAt`）重名，无论大小写。

属性值（**values**）可以是字符串、数字、布尔值、数组或字典（任何能以 JSON 编码的数据）。参见 [数据类型](#TODO)。

我们推荐使用驼峰式命名法（CamelCase）为类和属性来取名。类，采用大驼峰法，如 `CustomData`。属性，采用小驼峰法，如 `imageUrl`。

### 获取对象

对于已经保存到云端的 `LCObject`，可以通过它的 `objectId` 将其取回：

```js
storage
  .class('Todo')
  .object('582570f38ac247004f39c24b')
  .get()
  .then((data) => {
    const title = data.title;
    const priority = data.priority;
    // 获取内置属性
    const objectId = data.objectId;
    const updatedAt = data.updatedAt;
    const createdAt = data.createdAt;
  });
```

<!-- TODO -->

### 更新对象

要更新一个对象，只需指定需要更新的属性名和属性值，然后调用 set 方法。例如：

```js
storage.class('Todo').object('582570f38ac247004f39c24b').set({
  content: '这周周会改到周三下午三点。',
});
```

#### 有条件更新对象

TODO：Query 还未实现

#### 更新计数器

设想我们正在开发一个微博，需要统计一条微博有多少个赞和多少次转发。由于赞和转发的操作可能由多个客户端同时进行，直接在本地更新数字并保存到云端的做法极有可能导致差错。为保证计数的准确性，可以通过 **原子操作** 来增加或减少一个属性内保存的数字：

```js
import { Operation } from 'leancloud';

post.set({
  likes: Operation.increment(1),
});
```

可以指定需要增加或减少的值。若未指定，则默认使用 `1`。

注意，虽然原子增减支持浮点数，但因为底层数据库的浮点数存储格式限制，会有舍入误差。 因此，需要原子增减的字段建议使用整数以避免误差，例如 `3.14` 可以存储为 `314`，然后在客户端进行相应的转换。 否则，以比较大小为条件查询对象的时候，需要特殊处理， `< a` 需改查 `< a + e`，`> a` 需改查 `> a - e`，`== a` 需改查 `> a - e` 且 `< a + e`，其中 `e` 为误差范围，据所需精度取值，比如 `0.0001`。

#### 更新数组

更新数组也是原子操作。使用以下方法可以方便地维护数组类型的数据：

- `Operation.add(values)`<br>
  将指定对象附加到数组末尾。
- `Operation.addUnique(values)`<br>
  如果数组中不包含指定对象，则将该对象加入数组。对象的插入位置是随机的。
- `Operation.remove(values)`<br>
  从数组字段中删除指定对象的所有实例。

例如，`Todo` 用一个 `alarms` 属性保存所有闹钟的时间。下面的代码将多个时间加入这个属性：

```js
const alarm1 = new Date('2018-04-30T07:10:00');
const alarm2 = new Date('2018-04-30T07:20:00');
const alarm3 = new Date('2018-04-30T07:30:00');

const alarms = [alarm1, alarm2, alarm3];

storage.class('Todo').add({
  alarms: Operation.addUnique(alarms);
})
```

### 删除对象

下面的代码从云端删除一个 `Todo` 对象；

```js
const todo = storage.class('Todo').object('582570f38ac247004f39c24b');
todo.delete();
```

如果只需删除对象的一个属性，可以用 `delete` Operation：

```js
const todo = storage.class('Todo').object('582570f38ac247004f39c24b');

// priority 属性会被删除
todo.set({
  priority: Operation.delete(),
});
```

> 删除对象是一个较为敏感的操作，我们建议你阅读 [ACL 权限管理开发指南](#TODO) 来了解潜在的风险。熟悉 class 级别、对象级别和字段级别的权限可以帮助你有效阻止未经授权的操作。

### 批量操作

可以在一次请求中包含多个构建、保存和删除对象的操作：

```js
const Todo = storage.class('Todo');

const batch = storage.batch();

batch.set(Todo.object('582570f38ac247004f39c24b'), {
  // ...
});

batch.delete(Todo.object('582570f38ac247004f39c24c'));

batch.commit();
```

<!-- TODO -->

虽然上述方法可以在一次请求中包含多个操作，每一个分别的保存或同步操作在计费时依然会被算作一次请求，而所有的删除操作则会被合并为一次请求。

### 数据模型

对象之间可以产生关联。拿一个博客应用来说，一个 `Post` 对象可以与许多个 `Comment` 对象产生关联。LeanCloud 支持三种关系：一对一、一对多、多对多。

#### 一对一、一对多关系

一对一、一对多关系可以通过将 `LCObject` 保存为另一个对象的属性值的方式产生。比如说，让博客应用中的一个 `Comment` 指向一个 `Post`。

下面的代码会创建一个含有单个 `Comment` 的 `Post`：

```js
// 创建 post
const Post = storage.class('Post');

await Post.add({
  title: '饿了……',
  content: '中午去哪吃呢？',
});

// 创建 comment
const Comment = storage.class('Comment');
Comment.add({
  post: post, // 将 post 设为 comment 的一个属性值
  content: '当然是肯德基啦！',
});
```

云端存储时，会将被指向的对象用 `Pointer` 的形式存起来。你也可以用 `objectId` 来指向一个对象：

```js
const post = storage.class('Post').object('57328ca079bc44005c2472d0');
comment.set({
  post: post,
});
```

请参阅 [关系查询](#TODO) 来了解如何获取关联的对象。

#### 多对多关系

TODO

### 序列化和反序列化

TODO

## 查询

我们已经了解到如何从云端获取单个 `LCObject`，但你可能还会有一次性获取多个符合特定条件的 `LCObject` 的需求，这时候就需要用到 `Query` 了。

### 基础查询

执行一次基础查询通常包括这些步骤：

1. 构建 `Query`；
2. 向其添加查询条件；
3. 执行查询并获取包含满足条件的对象的数组。

下面的代码获取所有 `lastName` 为 `Smith` 的 `Student`：

```js
const Student = storage.class('Student');
Student.where('lastName', '==', 'Smith')
  .get()
  .then((students) => {
    // students 是包含满足条件的 Student 对象的数组
  });
```

### 查询条件

可以给 `LCObject` 添加不同的条件来改变获取到的结果。

下面的代码查询所有 `firstName` 不为 `Jack` 的对象：

```js
Student.where('firstName', '!=', 'jack');
```

对于能够排序的属性（比如数字、字符串），可以进行比较查询：

```js
// 限制 age < 18
Student.where('age', '<', 18);

// 限制 age <= 18
Student.where('age', '<=', 18);

// 限制 age > 18
Student.where('age', '>', 18);

// 限制 age >= 18
Student.where('age', '>=', 18);
```

可以在同一个查询中设置多个条件，这样可以获取满足所有条件的结果。可以理解为所有的条件是 `AND` 的关系：

```js
Student.where('firstName', '==', 'Jack').where('age', '>', 18);
```

可以通过指定 `limit` 限制返回结果的数量（默认为 `100`）：

```js
// 最多获取 10 条结果
Student.limit(10);
```

> 由于性能原因，`limit` 最大只能设为 `1000`。即使将其设为大于 `1000` 的数，云端也只会返回 1,000 条结果。

如果只需要一条结果，可以直接用 `first`:

```js
const Todo = storage.class('Todo');
Todo.where('priority', '==', 2)
  .first()
  .then((todo) => {
    // todo 是第一个满足条件的 Todo 对象
  });
```

可以通过设置 `skip` 来跳过一定数量的结果：

```js
// 跳过前 20 条结果
Todo.where('priority', '==', 2).skip(20);
```

把 `skip` 和 `limit` 结合起来，就能实现翻页功能：

```js
Todo.where('priority', '==', 2).skip(20).limit(10);
```

> 需要注意的是，`skip` 的值越高，查询所需的时间就越长。作为替代方案，可以通过设置 `createdAt` 或 `updatedAt` 的范围来实现更高效的翻页，因为它们都自带索引。

对于能够排序的属性，可以指定结果的排序规则：

```js
const query = Todo.where('priority', '==', 2);

// 按 createdAt 升序排列
query.orderBy('createdAt');

// 按 createdAt 降序排列
query.orderBy('createdAt', 'desc');
```

还可以为同一个查询添加多个排序规则：

```js
query.orderBy('priority').orderBy('createdAt', 'desc');
```

下面的代码可用于查找包含或不包含某一属性的对象：

```js
// 查找包含 'images' 的对象
query.where('images', 'exists');

// 查找不包含 'images' 的对象
query.where('images', 'not-exists');
```

可以用 `where(<key>, 'in', <子查询>)` 查找某一属性值为另一查询返回结果的对象。

比如说，你有一个用于存储国家和语言对应关系的 `Country` class，还有一个用于存储学生国籍的 `Student` class：

| name  | language |
| ----- | -------- |
| US    | English  |
| UK    | English  |
| China | Chinese  |

| fullName   | nationality |
| ---------- | ----------- |
| John Doe   | US          |
| Tom Sawyer | UK          |
| Ming Li    | China       |

下面的代码可以找到所有来自英语国家的学生：

```js
const Student = storage.class('Student');
const Country = storage.class('Country');

Student.where(
  'nationality',
  'in',
  Country.select('name').where('language', '==', 'English')
);
```

可以通过 `select` 指定需要返回的属性。下面的代码只获取每个对象的 `title` 和 `content`（包括内置属性 `objectId`、`createdAt` 和 `updatedAt`）：

```js
const Todo = storage.class('Todo');
Todo.select('title', 'content')
  .first()
  .then((todo) => {
    const title = todo.title; // √
    const content = todo.content; // √
    const notes = todo.notes; // undefined
  });
```

`select` 支持点号（`author.firstName`），详见 [点号使用指南](#TODO)。 另外，字段名前添加减号前缀表示反向选择，例如 `-author` 表示不返回 `author` 字段。 反向选择同样适用于内置字段，比如 `-objectId`，也可以和点号组合使用，比如 `-pubUser.createdAt`。

对于未获取的属性，可以通过对结果中的对象进行 `fetch` 操作来获取。参见 [同步对象](#TODO)。

### 字符串查询

TODO: 字符串查询貌似是封装了正则查询，如何支持待定

### 数组查询

下面的代码查找所有数组属性 `tags` 包含 `工作` 的对象：

```js
query.where('tags', 'has', '工作');
```

下面的代码查询数组属性长度为 3 （正好包含 3 个标签）的对象：

```js
query.where('tags', 'length-is', 3);
```

下面的代码查找所有数组属性 `tags` **同时包含**`工作`、`销售`和`会议`的对象：

```js
query.where('tags', 'has', ['工作', '销售', '会议']);
```

下面的代码构建的查询查找所有 `priority` 为 `1` **或** `2` 的 todo 对象：

```js
const priorityOneOrTwo = Todo.where('priority', 'has-any', [1, 2]);
```

可以用 `not-has-any` 来获取某一属性值不包含一列值中任何一个的对象。

### 关系查询

查询关联数据有很多种方式，常见的一种是查询某一属性值为特定 `LCObject` 的对象，这时可以像其他查询一样直接用 `==`。比如说，如果每一条博客评论 `Comment` 都有一个 `post` 属性用来存放原文 `Post`，则可以用下面的方法获取所有与某一 Post 相关联的评论：

```js
const Comment = storage.class('Comment');
const Post = storage.class('post');

Comment.where('post', '==', Post.object('57328ca079bc44005c2472d0'))
  .get()
  .then((comments) => {
    // comments 包含与 post 相关联的评论
  });
```

如需获取某一属性值为另一查询结果中任一 `LCObject` 的对象，可以用 `in`。下面的代码构建的查询可以找到所有包含图片的博客文章的评论：

```js
Comment.where('post', 'in', Post.where('image', 'exists'));
```

如需获取某一属性值不是另一查询结果中任一 `LCObject` 的对象，则使用 `not-in`。

有时候可能需要获取来自另一个 class 的数据而不想进行额外的查询，此时可以在同一个查询上使用 `include`。下面的代码查找最新发布的 10 条评论，并包含各自对应的博客文章：

```js
const query = Comment.include('post').orderBy('createdAt', 'desc').limit(10);

query.get().then((comments) => {
  comments.forEach((comment) => {
    // 该操作无需网络连接
    const post = comment.post;
  });
});
```

可以用 dot 符号（`.`）来获取多级关系，例如 `post.author`，详见 [点号使用指南](#TODO)。`include` 可以包含多个属性。

> 通过 `include` 进行多级查询的方式不适用于数组属性内部的 `LCObject`，只能包含到数组本身。

#### 注意事项

TODO

### 统计总数量

如果只需知道有多少对象匹配查询条件而无需获取对象本身，可使用 `count` 来代替 `get`。比如说，查询有多少个已完成的 todo：

```js
Todo.where('isComplete', '==', true)
  .count()
  .then((count) => {
    console.log(`${count} 个 todo 已完成。`);
  });
```

### 组合查询

组合查询就是把诸多查询条件用一定逻辑合并到一起（`OR` 或 `AND`）再交给云端去查询。

#### OR

OR 操作表示多个查询条件符合其中任意一个即可。 例如，查询优先级大于等于 `3` 或者已经完成了的 todo：

```js
Todo.where('priority', '>', 3).or().where('isComplete', '==', true);
```

#### AND

使用 AND 查询的效果等同于设置多个 `where` 条件。下面的代码构建的查询会查找创建时间在 `2016-11-13` 和 `2016-12-02` 之间的 todo：

```js
Todo.where('createdAt', '>=', new Date('2016-11-13 00:00:00')).where(
  'createdAt',
  '<',
  new Date('2016-12-03 00:00:00')
);
```

单独使用 AND 查询跟使用基础查询相比并没有什么不同，不过当查询条件中包含不止一个 OR 查询时，就必须使用 `and` 函数分割：

```js
Todo.where('createdAt', '>=', new Date('2018-04-30'))
  .or()
  .where('createdAt', '<', new Date('2018-05-01'))
  .and()
  .where('priority', '==', 2);
```

当查询条件较为复杂时，这种组织方式就有些难以理解了，这时可以使用 `Query.and` 和 `Query.or` 组织多个 AND 和 OR 查询：

```js
const createdAtQuery = Todo.where(
  'createdAt',
  '>=',
  new Date('2018-04-30')
).where('createdAt', '<', new Date('2018-05-01'));

const locationQuery = Todo.where('location', 'not-exists');

const priority2Query = Todo.where('priority', '==', 2);

const priority3Query = Todo.where('priority', '==', 3);

const priorityQuery = Query.or(priority2Query, priority3Query);
const timeLocationQuery = Query.or(createdAtQuery, locationQuery);
const query = Query.and(priorityQUery, timeLocationQuery);
```
