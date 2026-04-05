package be.com.springbootclaude.integration.graphql.advanced

import be.com.springbootclaude.basic.repository.UserRepository
import be.com.springbootclaude.integration.graphql.shared.GraphqlUser
import org.dataloader.DataLoader
import org.dataloader.DataLoaderFactory
import org.dataloader.MappedBatchLoader
import org.springframework.context.annotation.Configuration
import org.springframework.graphql.execution.DataLoaderRegistryConfigurer
import java.util.concurrent.CompletableFuture

/**
 * GraphqlDataLoaderConfig: DataLoader 등록
 *
 * 학습 포인트:
 * - GraphQL에서 동일 리소스 다건 조회 시 batching/caching
 * - N+1 문제를 구조적으로 해결할 수 있습니다.
 */
@Configuration
class GraphqlDataLoaderConfig(
    private val userRepository: UserRepository
) : DataLoaderRegistryConfigurer {

    override fun configure(registry: org.dataloader.DataLoaderRegistry) {
        val batchLoader = MappedBatchLoader<Long, GraphqlUser> { keys ->
            CompletableFuture.supplyAsync {
                val users = userRepository.findAllById(keys)
                    .associateBy { it.id!! }
                keys.associateWith { id ->
                    val user = users[id]
                    requireNotNull(user) { "User not found: $id" }
                    GraphqlUser.from(user)
                }
            }
        }

        val dataLoader: DataLoader<Long, GraphqlUser> =
            DataLoaderFactory.newMappedDataLoader(batchLoader)

        registry.register("authorLoader", dataLoader)
    }
}
