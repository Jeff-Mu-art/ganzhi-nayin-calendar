# 六爻资料库 HTML 程序

这是静态 HTML RAG 检索程序。它内置由 `combined_liuyao_rag.db` 导出的公开案例和古籍分块，支持浏览器本地关键词检索、查看来源、生成可复制的本地模型提示词。

```bash
python3 build_html_rag_data.py
cd html_app
python3 -m http.server 8080
```

浏览器静态发布不运行 MLX/Apple GPU adapter；训练结果应在本机 MLX 推理服务中使用。网页负责可追溯资料检索与提示词构造。
