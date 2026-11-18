# 维护与发布说明

## 一、仓库分工与默认隔离边界

- **公开网站仓库**：`Wu-kaixin/wu-kaixin.github.io`（`public`，仅允许向 `main` 分支推送，通过 `.github/workflows/pages.yml` 部署 GitHub Pages）。
- **研究工作目录与私有仓库**：原始轨迹、原生数据库（`.sqlite` 等）、完整日志、详细配置与批量实验结果默认保存在本地研究目录或已核实的私有仓库中，绝不放入本公开仓库，也不使用本仓库的其他分支或标签作为私有备份（`.gitignore` 仅作为辅助防误触措施）。
- **已记录的公开基线与历史说明**：
  - 当前唯一获批继续公开的研究演示为 `Atrium 100` 双语静态疏散回放（源自 `atrium100_20261106_delivery_v5 / site_v2`，16 组开发结果、15,287 帧及已有 `export_manifest.json`、`README.md`、各案例 `meta.json` 下载链接），共 272 个具体文件，逐文件 SHA-256 与字节大小锁定在 `content/public_manifest.json`。
  - 浏览器实际接收的回放帧和指标均视为公开数据；隐藏按钮不构成数据隔离。
  - `2026-11-06` 更早历史推送对象状态已如实记录于 `content/public_manifest.json` 的 `historical_public_records`，不宣称修改 `.gitignore` 可撤回远端历史缓存对象。

---

## 二、日常修改个人主页文字

### 在 GitHub 网页上改文字

1. 打开 `content/site.json` 修改个人简介、教育经历、研究经历、技能或已发表论文题录（`zh` 中文、`en` 英文）。`publications` 仅填已正式发表论文与 DOI，不托管未发表稿件或实验明细。
2. 提交到 `main` 后，GitHub Actions 会自动在独立构建目录 `dist/` 生成网页、执行发布检查并部署到 Pages。

### 在本地修改与预览

```powershell
python tools/build.py
python tools/check_release.py --check-manifest --check-staged --check-artifact dist
python tests/check_site.py --site-dir dist
python -m http.server 8000 --directory dist
```

打开 `http://localhost:8000/` 预览构建产物 `dist/`（`dist/` 为独立构建输出目录，每次构建自动清空重建，且不纳入 Git 提交）。确认无误后按具体文件暂存、提交并推送：

```powershell
git add content/site.json
git commit -m "Update personal profile"
git push origin main
```

本地首次克隆后运行一次 `python tools/build.py`（或 `python tools/check_release.py --install-hooks`）即可自动启用 `.githooks/pre-commit` 与 `.githooks/pre-push` 守卫：
- 推送前自动扫描**全部待推送的新提交**及目标分支（非 `main` 分支直接拦截）。
- 若混入未列入 `content/public_manifest.json` 的文件，或清单内文件被新实验覆盖导致 SHA-256 变化，提交、构建、推送和 CI 部署前检查均会拒绝并指出具体文件。

---

## 三、如何单独发布一个新演示（不连带公开整批实验数据）

当研究目录中完成了多组新实验，但仅希望公开其中某一个新演示（或某一个指定案例）时，按以下步骤操作，避免复制整个实验目录：

1. **在研究目录单独导出展示包**（保持原始实验目录只读，不包含 `.sqlite`、原始 CSV 轨迹或完整日志）。
2. **使用 `tools/stage_demo.py` 先做干跑预览（不写入文件）**，若是多案例对比导出包，必须通过 `--runs` 指定获准公开的具体案例 ID，未指定的同批案例及哈希会被自动剔除：

```powershell
python tools/stage_demo.py `
  --demo-id atrium-case-demo `
  --mount demos/atrium-case `
  --from-export C:\path\to\exported_demo_dir `
  --runs internal_cfs_v3 `
  --origin-version "study_tag / export_v1" `
  --title-zh "单案例疏散演示" `
  --title-en "Single-case evacuation demo"
```

   若是自定义静态网页演示（无 `manifest.json`），则用 `--files index.html assets/demo.js data/summary.json` 明确逐个列出文件，禁止使用 `runs/**`、`results/**` 等通配符。
   如需在首页研究卡片同时增加入口按钮，可附加 `--project-id crowds`（或 `transport`）及 `--homepage-label-zh` / `--homepage-label-en`。

3. **核对预览文件列表无误后，显式加 `--update-manifest` 写入并登记 SHA-256**：

```powershell
python tools/stage_demo.py `
  --demo-id atrium-case-demo `
  --mount demos/atrium-case `
  --from-export C:\path\to\exported_demo_dir `
  --runs internal_cfs_v3 `
  --origin-version "study_tag / export_v1" `
  --title-zh "单案例疏散演示" `
  --title-en "Single-case evacuation demo" `
  --update-manifest
```

4. **构建独立产物 `dist/` 并执行发布检查与预览**：

```powershell
python tools/build.py
python tools/check_release.py --check-manifest --check-artifact dist
python tests/check_site.py --site-dir dist
python -m http.server 8000 --directory dist
```

5. **仅暂存该新演示目录与公开清单，提交并推送 `main`**：

```powershell
git add site/demos/atrium-case content/public_manifest.json
git commit -m "Publish approved atrium-case demo"
git push origin main
```

---

## 文件分工

| 文件 / 目录 | 作用 |
| --- | --- |
| `content/site.json` | 个人简介、教育与研究经历、技能、研究概述、已发表论文题录与学术档案链接 |
| `content/public_manifest.json` | 唯一公开研究素材白名单（逐文件路径、字节数、SHA-256 哈希与版本来源记录） |
| `tools/build.py` | 在独立构建目录 `dist/` 生成中英文主页，并严格按 `public_manifest.json` 导入研究素材 |
| `tools/stage_demo.py` | 从外部导出目录按单案例或明确文件列表导入新演示，并更新 `public_manifest.json` |
| `tools/check_release.py` | 提交前、推送前（检查全部待推送提交及分支）与部署前产物一致性检查 |
| `tests/check_site.py` | 检查 `dist/` 页面链接、Atrium 100 的 16 组回放与保留的下载链接 |
| `site/assets/` | 个人主页样式、概念示意图与前端交互脚本 |
| `site/evacuation/` | 已获批保留的 Atrium 100 静态演示源文件（受 `public_manifest.json` 哈希保护） |
| `dist/` | 独立网站构建产物目录（Git 忽略，GitHub Actions 仅上传此目录至 Pages） |
