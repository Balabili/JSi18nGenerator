# JSi18nGenerator

js文件格式为
```
export default {
  language: "English",

  home_official: ['官', '网'],
  home_official_contact: item => `联系我们 ${item}`,
};

```
最下边空一行，value值均使用""而不是''

xlsx文件第一列为key,第二列中文，第三列英文

在合并xlsx到js文件完成后会生成一个回馈xlsx文件记录字段合并成功与否

xlsx与js文件格式详见public文件夹