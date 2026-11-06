# 修改个人网站

## 在 GitHub 网页上改文字

1. 打开 content/site.json，点击铅笔图标。
2. 修改姓名、身份、简介、研究概述或学术档案链接；zh 是中文，en 是英文。
3. 点击 Commit changes 提交 main。
4. 在 Actions 确认 Publish research site 成功，再刷新网站。

保留 JSON 的引号和逗号。网站默认只放简短的研究介绍；不上传未发表论文、实验明细、数据或内部资料。publications 中只添加已确认正式发表的论文题录和 DOI；不托管 PDF。现有 3 篇已与本人 ORCID 和 Crossref 出版元数据核对。

## 用 Cursor 修改

```powershell
git clone https://github.com/Wu-kaixin/collective-horizons.git
cd collective-horizons
```

用 Cursor 打开目录，修改后执行：

```powershell
python tools/build.py
python tests/check_site.py
node --check site/assets/app.js
python -m http.server 8000 --directory site
```

打开 http://localhost:8000/ 预览。按 Ctrl+C 结束；检查通过后提交：

```powershell
git add .
git commit -m "Update personal website"
git push origin main
```

## 文件分工

| 文件 | 作用 |
| --- | --- |
| content/site.json | 姓名、简介、研究概述、已发表论文题录、Google Scholar/ORCID/GitHub 链接、正式网址 |
| tools/build.py | 中英文页面结构；需要新增栏目或页面时从这里扩展 |
| site/assets/portfolio.css | 配色、排版与手机样式 |
| site/assets/app.js | 概念图切换与手机菜单 |

不要直接编辑生成的 site/index.html，因为下次构建会覆盖它。需要新增页面时，可以直接告诉助手页面名称和准备公开的简短内容；先明确公开范围，再修改生成器。

GitHub Pages 为正式公开版；Sites 的私人版本与 GitHub 不会自动双向同步。
