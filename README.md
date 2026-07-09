# 预算单元复杂选择器

基于 React + TypeScript + Vite 的预算单元选择器交互原型，接入了 `@ve-o-design/web-react`，当前包含两套交互方案预览。

## 访问地址

- GitHub Repository: `https://github.com/hyin9412/budget-unit-selector`
- GitHub Pages: `https://hyin9412.github.io/budget-unit-selector/`

## 本地启动

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run preview
npm run test:run
```

## 部署方式

当前采用 GitHub Actions 自动构建，并将产物发布到 `gh-pages` 分支。

### 自动发布

推送到 `main` 分支后会自动执行：

```bash
npm install --legacy-peer-deps
npm run build
```

构建完成后，GitHub Actions 会把 `dist/` 发布到 `gh-pages` 分支，GitHub Pages 再从该分支提供线上访问。

### Pages 配置

仓库的 GitHub Pages 来源需要指向：

- Branch: `gh-pages`
- Folder: `/ (root)`

### 手动触发

如果已经配置好 workflow，也可以在 GitHub 仓库的 Actions 页面手动重新运行部署任务。

## GitHub Pages 注意事项

这个项目部署在子路径 `/budget-unit-selector/` 下，Vite 和 React Router 都要显式处理基路径：

- `vite.config.ts` 中生产环境 `base` 为 `/budget-unit-selector/`
- `src/App.tsx` 中 `BrowserRouter` 需要使用 `basename={import.meta.env.BASE_URL}`

如果漏掉 `basename`，线上会出现静态资源正常加载但页面主体空白的问题。
