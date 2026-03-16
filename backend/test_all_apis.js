import fetch from 'node-fetch';

async function testAllAPIs() {
  console.log('=== 测试所有API端点 ===\n');
  
  const endpoints = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/students',
    '/api/topics',
    '/api/taskbooks',
    '/api/proposals',
    '/api/midterms',
    '/api/reviews'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch('http://localhost:3000' + endpoint);
      console.log(`${endpoint}: ${response.status} - ${response.statusText}`);
      
      // 如果是详细数据端点，显示数据数量
      if (endpoint.includes('/students') || endpoint.includes('/topics')) {
        const data = await response.json();
        console.log(`  数据数量: ${data.length || 0}`);
      }
    } catch (error) {
      console.log(`${endpoint}: 错误 - ${error.message}`);
    }
  }
  
  console.log('\n=== 测试中文用户登录 ===');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'zhangwei_teacher@example.com',
        password: '123456'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('登录成功 ✅');
      console.log('用户姓名:', loginData.user.name);
      console.log('用户角色:', loginData.user.role);
      console.log('院系:', loginData.user.department);
      
      // 测试获取用户信息
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + loginData.token }
      });
      
      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('获取用户信息成功 ✅');
        console.log('用户数据:', meData.user.name, meData.user.department);
      }
    } else {
      console.log('登录失败 ❌');
    }
  } catch (error) {
    console.log('登录测试错误:', error.message);
  }
}

testAllAPIs();