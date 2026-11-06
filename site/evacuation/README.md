# Atrium 100 / 双语静态演示

Upload this entire directory to your website, keeping relative paths. Open index.html. Root and subdirectory hosting both work. No Python, Java, npm build, API key or CDN is needed on the host.

将整个目录上传到网站，保持目录结构，访问 index.html；支持网站根目录与子目录。服务器无需安装 Python、Java 或 npm，也无需配置 API。

For local preview serve this directory over HTTP; file:// does not permit JSON fetch. Use the repository command: --serve <this-directory> --port 0.

本地预览请通过 HTTP 服务打开；不要直接双击 HTML。中英文可随时切换，语言选择会保留。

This publishes recorded native results, not an online solver. Full raw native trajectories, failure records and source snapshots remain in the original local experiment directory. All replay frames and native ellipse axes are retained without rounding or resampling.

发布的是原生仿真回放，并非在线求解服务。原始轨迹、失败记录和源码快照仍保存在本地实验目录。回放帧和原生椭圆数据完整保留，无降采样或精度截断。
