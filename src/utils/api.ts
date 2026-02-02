/**
 * 基金与股票数据 API 工具类
 */

// 常用指数代码
export const MARKET_INDEXES = [
    { code: 's_sh000001', name: '上证指数' },
    { code: 's_sz399001', name: '深证成指' },
    { code: 's_sz399006', name: '创业板指' },
    { code: 's_sh000688', name: '科创50' },
    { code: 's_sh000852', name: '中证1000' },
    { code: 'hkHSI', name: '恒生指数' },
    { code: 'gb_ixic', name: '纳斯达克' },
    { code: 'gb_dji', name: '道琼斯' },
    { code: 'gb_inx', name: '标普500' },
    { code: 'hf_GC', name: '黄金期货' },
];

/**
 * 获取大盘指数数据
 * 通过 Vite 代理解决跨域问题
 */
export const fetchMarketData = async (codes: string[]) => {
    const list = codes.join(',');
    // 使用代理路径 /api-sina
    const url = `/api-sina/list=${list}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Referer': 'https://finance.sina.com.cn/',
                'Accept': '*/*',
            }
        });
        
        // 新浪接口返回的是 GBK 编码，使用 TextDecoder 转换为 UTF-8
        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        const text = decoder.decode(arrayBuffer);
        
        // 解析格式支持两种：
        // 1. var hq_str_xxx="名称,点数,涨跌,涨跌幅,..."
        // 2. str_xxx = "数据内容" (如黄金期货)
        const results = [];
        const lines = text.split(';');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            let code: string | null = null;
            let dataStr: string | null = null;
            
            // 匹配标准格式: var hq_str_代码="数据内容"
            let match = trimmedLine.match(/var\s+hq_str_(.+?)=["']([^"']+)["']/);
            if (match) {
                code = match[1].trim();
                dataStr = match[2];
            } else {
                // 匹配特殊格式: str_代码 = "数据内容" (如黄金期货)
                match = trimmedLine.match(/str_(.+?)\s*=\s*["']([^"']+)["']/);
                if (match) {
                    code = match[1].trim();
                    dataStr = match[2];
                }
            }
            
            if (!code || !dataStr) continue;
            
            // 按逗号分割数据
            const data = dataStr.split(',');
            
            // 处理A股指数格式（如：上证指数,4136.1642,13.5882,0.33）
            // 格式：名称,当前点数,涨跌点数,涨跌幅百分比
            if (code.startsWith('s_')) {
                if (data.length >= 4) {
                    const name = data[0]?.trim() || '';
                    const points = parseFloat(data[1]);
                    const change = parseFloat(data[2]);
                    const changePercent = parseFloat(data[3]);
                    
                    if (!isNaN(points) && !isNaN(change) && !isNaN(changePercent)) {
                        results.push({
                            code,
                            name,
                            points,
                            change,
                            changePercent,
                        });
                    }
                }
            }
            // 处理港股格式（如：HSI,恒生指数,26861.360,26629.961,...）
            // 格式：代码,名称,当前点数,昨收,最高,最低,开盘,涨跌点数,涨跌幅百分比,...
            else if (code.startsWith('hk')) {
                if (data.length >= 9) {
                    const name = data[1]?.trim() || data[0]?.trim() || '';
                    const points = parseFloat(data[2]);
                    const change = parseFloat(data[7]);
                    const changePercent = parseFloat(data[8]);
                    
                    if (!isNaN(points) && !isNaN(change) && !isNaN(changePercent)) {
                        results.push({
                            code,
                            name,
                            points,
                            change,
                            changePercent,
                        });
                    }
                }
            }
            // 处理美股格式（如：标普500指数,6913.3501,0.55,2026-01-23 05:35:23,37.7300,...）
            // 格式：名称,当前点数,涨跌幅百分比,时间,涨跌点数,...
            else if (code.startsWith('gb_')) {
                if (data.length >= 5) {
                    const name = data[0]?.trim() || '';
                    const points = parseFloat(data[1]);
                    const changePercent = parseFloat(data[2]);
                    const change = parseFloat(data[4]);
                    
                    if (!isNaN(points) && !isNaN(change) && !isNaN(changePercent)) {
                        results.push({
                            code,
                            name,
                            points,
                            change,
                            changePercent,
                        });
                    }
                }
            } 
            // 处理黄金期货格式: str_hf_GC = "4923.450,,4925.900,4926.300,4970.000,4901.200,18:21:18,4913.400,4940.000,0,2,2,2026-01-23,纽约黄金,0"
            // 格式：买价,空,卖价,当前价,最高,最低,时间,昨收,开盘,...,日期,名称,0
            else if (code === 'hf_GC') {
                if (data.length >= 14) {
                    const points = parseFloat(data[3]); // 当前价格在第4个位置（索引3）
                    const prevClose = parseFloat(data[7]); // 昨收价格在第8个位置（索引7）
                    const name = data[data.length - 2]?.trim() || '黄金期货';
                    
                    // 计算涨跌和涨跌幅
                    const change = points - prevClose;
                    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
                    
                    if (!isNaN(points) && !isNaN(prevClose)) {
                        results.push({
                            code,
                            name,
                            points,
                            change,
                            changePercent,
                        });
                    }
                }
            }
        }
        return results;
    } catch (error) {
        console.error('获取大盘数据失败:', error);
        return [];
    }
};

/**
 * 基金估值接口返回类型
 */
export interface FundGZResponse {
    fundcode: string;
    name: string;
    jzrq: string;   // 净值日期，如 "2026-01-23"
    dwjz: string;   // 单位净值（昨日）
    gsz: string;   // 估算净值（当前）
    gszzl: string; // 估算涨跌幅，如 "0.62" 表示 0.62%
    gztime: string; // 估值时间，如 "2026-01-27 05:00"
}

/**
 * 获取基金估值数据 (天天基金网接口)
 * 格式: jsonpgz({"fundcode":"000001",...});
 * 通过 Vite 代理解决跨域问题
 */
export const fetchFundGZ = async (fundCode: string): Promise<FundGZResponse | null> => {
    // 使用代理路径 /api-fund
    const url = `/api-fund/js/${fundCode}.js?rt=${Date.now()}`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // 提取 JSON 部分，改为匹配括号内的内容，考虑到名称中可能含有括号，匹配到最后一个 )
        const startIdx = text.indexOf('(');
        const endIdx = text.lastIndexOf(')');
        if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = text.substring(startIdx + 1, endIdx);
            return JSON.parse(jsonStr);
        }
        return null;
    } catch (error) {
        console.error(`获取基金 ${fundCode} 估值失败:`, error);
        return null;
    }
};

/**
 * 判断估值时间是否是今天
 */
export const isUpdatedToday = (gztime: string) => {
    if (!gztime) return false;
    
    try {
        // gztime 格式通常为 "2026-01-23 15:00"
        const gzDateStr = gztime.split(' ')[0]; // 获取 "2026-01-23"
        
        // 获取本地今天的日期字符串
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        return gzDateStr === todayStr;
    } catch {
        return false;
    }
};
