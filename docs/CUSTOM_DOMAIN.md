# 给 GitHub Pages 绑定自定义域名

核对日期：2026-11-06。以下配置针对当前 GitHub Pages 网站。域名由你自己选购或提供；本文不表示已购买或绑定任何域名。注册和续费通常收费，现有 github.io 地址不需要另买域名。

## 示例：使用 research.example.com

这里的 example.com 仅为示例，替换为你实际拥有的域名。

1. GitHub **个人账号 Settings → Pages → Add a domain**，添加 example.com。按 GitHub 显示的名称和值在域名服务商添加 TXT 记录，再回 GitHub 验证。保留该 TXT 记录。
2. 打开 **Wu-kaixin/collective-horizons → Settings → Pages → Custom domain**，输入 research.example.com，保存。
3. 在域名服务商的 DNS 管理页面添加：

| 类型 | 主机记录 | 目标值 |
| --- | --- | --- |
| CNAME | research | wu-kaixin.github.io |

目标值不能包含 https://、/collective-horizons/ 或其他路径。先在 GitHub 保存域名，再配置站点的 DNS 指向。

4. 等待 DNS 验证和证书就绪，在 Pages 勾选 **Enforce HTTPS**。DNS 生效和 HTTPS 选项可能需要最多约 24 小时。
5. 修改 content/site.json 中的 site_url 为 https://research.example.com/，提交 main。它会更新 canonical、语言版本链接、分享图片地址、sitemap.xml 和 robots.txt。站内资源使用相对路径，无须逐个修改。

## 示例：使用根域名 example.com

先完成账号域名验证，并在仓库 Pages 中保存 example.com，再在 DNS 中添加以下四条 A 记录：

| 类型 | 主机记录 | 目标值 |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | wu-kaixin.github.io |

可选 IPv6：为 @ 添加 2606:50c0:8000::153、2606:50c0:8001::153、2606:50c0:8002::153、2606:50c0:8003::153。支持的 DNS 服务商也可以用 ALIAS/ANAME 指向 wu-kaixin.github.io 代替 A 记录方案。

核查并处理同一主机名下冲突的默认 DNS 记录，不要误删邮件所用的 MX/TXT 记录。根域名与 www 都配置正确时，GitHub 可以按你在 Pages 选择的主域名进行相互重定向。

## 当前工作流的注意点

本站通过自定义 GitHub Actions 工作流发布，GitHub 文档说明此模式不要求 CNAME 文件，已有 CNAME 文件会被忽略。设置入口是仓库 Settings → Pages。

更换或停用域名时，同时调整 GitHub Pages 设置与 DNS；保留域名验证记录，避免使用泛域名 * 的 DNS 记录。

Windows 可检查 DNS：

```powershell
Resolve-DnsName research.example.com -Type CNAME
Resolve-DnsName example.com -Type A
```

正式域名尚未确定，所以当前仍使用已有 github.io 地址。网站内容和数据交互不依赖购买域名。

## 官方依据

- 管理自定义域名：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- 验证域名：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
