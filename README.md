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

当前采用 GitHub Pages 的 `gh-pages` 分支发布，不依赖 GitHub Actions。

### 1. 构建生产产物

```bash
npm run build
```

### 2. 发布 `dist/` 到 `gh-pages`

在项目根目录执行：

```bash
tmpdir=$(mktemp -d /tmp/budget-unit-selector-pages.XXXXXX) && \
rsync -a dist/ "$tmpdir"/ && \
touch "$tmpdir"/.nojekyll && \
cd "$tmpdir" && \
git init -b gh-pages && \
git config user.name "YOUR_GITHUB_NAME" && \
git config user.email "YOUR_GITHUB_EMAIL" && \
git add . && \
git commit -m "Deploy GitHub Pages" && \
git remote add origin https://github.com/hyin9412/budget-unit-selector.git && \
git push -f origin gh-pages
```

### 3. 确认 GitHub Pages 来源

仓库的 Pages 配置需要指向：

- Branch: `gh-pages`
- Folder: `/ (root)`

## GitHub Pages 注意事项

这个项目部署在子路径 `/budget-unit-selector/` 下，Vite 和 React Router 都要显式处理基路径：

- `vite.config.ts` 中生产环境 `base` 为 `/budget-unit-selector/`
- `src/App.tsx` 中 `BrowserRouter` 需要使用 `basename={import.meta.env.BASE_URL}`

如果漏掉 `basename`，线上会出现静态资源正常加载但页面主体空白的问题。
