#!/bin/bash
# 自动提取中文并生成语言文件

HTML="index.html"

# 提取中文（排除已有的 data-i18n）
grep -oP '(?<=[\s>"])[\\u4e00-\\u9fff]+' "$HTML" | sort | uniq -c | sort -rn | head -100 > /tmp/zh_keys.txt

echo "=== 提取的中文关键词 ==="
head -30 /tmp/zh_keys.txt
