# Kaixin Wu · Research & Exploration

简洁的中英文个人学术主页：个人介绍、正在进行的研究、已发表论文题录、学术档案。

网站：https://wu-kaixin.github.io/collective-horizons/

## 内容范围

只展示概括性的研究方向与个人背景，以及从本人 ORCID 与 DOI 出版元数据交叉核实的已发表论文题录。论文链接指向 DOI 出版页面，不托管全文。学术入口为本人提供的 Google Scholar、ORCID 和 GitHub。不得自动上传未发表论文、论文初稿、实验数据、研究明细或内部材料。

## 修改内容

日常文字和学术档案链接集中在 content/site.json。中文为 zh，英文为 en。编辑并提交 main 后，GitHub Actions 自动生成和发布。

- [内容修改指南](docs/EDITING.md)
- [自定义域名指南](docs/CUSTOM_DOMAIN.md)

本地预览：

```sh
python tools/build.py
python tests/check_site.py
node --check site/assets/app.js
python -m http.server 8000 --directory site
```

纯静态网站，无数据库、访问追踪或付费 API。图中位置与轮廓为概念示意，不是算法输出或实验结果。
