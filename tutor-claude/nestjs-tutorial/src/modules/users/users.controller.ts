/**
 * ============================================================================
 * users.controller.ts — /users 라우트
 * ----------------------------------------------------------------------------
 * 데코레이터로 HTTP 메서드/경로/상태코드/문서를 선언합니다.
 * 인증은 전역 JwtAuthGuard 가 담당하므로, 여기서는 인가(@Roles)만 신경 씁니다.
 * ============================================================================
 */
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth() // Swagger UI 에 자물쇠 표시(토큰 필요)
@Controller('users')
// ClassSerializerInterceptor: @Exclude() 가 붙은 필드(password 등)를 응답에서 제거
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@CurrentUser('id') userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get()
  @Roles(Role.ADMIN) // 관리자만 전체 목록 조회
  @ApiOperation({ summary: '(관리자) 전체 사용자 목록' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '사용자 단건 조회' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    // ParseIntPipe: URL 파라미터 문자열을 number 로 변환 + 실패 시 400
    return this.usersService.findById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정 (닉네임)' })
  updateMe(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(userId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '(관리자) 사용자 삭제' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
