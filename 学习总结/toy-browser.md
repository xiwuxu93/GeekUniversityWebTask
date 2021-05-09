# 玩具版浏览器学习总结

## 总览

浏览器从一个 url 到最终的呈现，大体分为 5 个步骤。
HTTP 请求=>状态机解析 HTML 代码构建 DOM 树=>CSS 计算=>Layout=>render

## HTTP 请求

通过 nodejs net 库，模拟 HTTP 请求的 request 拼接，状态机解析响应字符串。

## 解析 HTML 构建 DOM 树

通过状态机把 HTML 字符串，解析成响应的标签与属性，并通过栈完成 DOM 树的构建。

## CSS 计算

在构建 DOM 树的过程中，识别 style 标签，获取 CSS 字符串，并通过 css 库，拿到 css ruleList，根据选择器与对应 DOM 节点匹配，在根据选择器的优先级计算出每个元素最终的 computedStyle，最终获得一颗带有 CSS 属性的 DOM 树。

## Layout

在这块目前是只处理 Flex 布局的 layout,首先是先确定元素的 main(主轴）与 cross(交叉轴)，然后再把元素进行分行，之后对每一行的字元素进行位置的计算（主轴尺寸，交叉轴尺寸，top，bottom，left，right）。最终形成带有位置的 DOM 树。

## render

利用 images 库，通过递归的形式，把每个元素的位置画到画布上，最终生成图片。
