import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Set value to redis', async () => {
    service.setValue('foo', 'bar');
    const value = await service.getValue('foo');
    expect(value).toBe('bar');
  });

  it('Forget value from redis', async () => {
    service.setValue('foo', 'bar');
    await service.forget('foo');
    const value = await service.getValue('foo');
    expect(value).toBe(null);
  });

  it('should return cached data when it exists', async () => {
    // Arrange
    const key = 'testKey';
    const ttl = 60 * 1000 * 60 * 24;

    const callbackData = () => {
      return { name: 'Rayhan', age: 27 };
    };

    // Act
    await service.rememberCallback(key, callbackData, ttl);
    const value = await service.getValue(key);

    // Assert
    expect(value).toMatchObject({ name: 'Rayhan', age: 27 });
  });

  it('set', async () => {
    await service.redis.sadd('socket-clients:user1', [
      'client1',
      'client2',
      'client2',
      'client2',
      'client2',
      'client2',
      'client2',
    ]);
    console.log(
      'members',
      await service.redis.smembers('socket-clients:user1'),
    );
  });
});
