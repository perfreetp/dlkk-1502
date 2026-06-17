import { User } from '@/types';

export const currentUser: User = {
  id: 'u1',
  name: '张三',
  phone: '138****1234',
  roomNumber: '2号楼1单元1001室',
  role: 'resident',
  isBlacklisted: false,
};

export const adminUser: User = {
  id: 'a1',
  name: '李物业',
  phone: '139****8888',
  roomNumber: '物业服务中心',
  role: 'admin',
  isBlacklisted: false,
};
