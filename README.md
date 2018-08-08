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