@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)

package com.folio.cv.ui.templates

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.util.lerp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.template.TemplateCategory
import com.folio.cv.ui.components.PageCanvas
import com.folio.cv.ui.components.PillButton
import com.folio.cv.ui.theme.Folio
import kotlin.math.absoluteValue

@Composable
fun TemplateGalleryScreen(vm: TemplatesViewModel, onBack: () -> Unit) {
    val state by vm.state.collectAsStateWithLifecycle()
    var categoryName by rememberSaveable { mutableStateOf<String?>(null) }
    val category = categoryName?.let { TemplateCategory.valueOf(it) }

    Scaffold(
        containerColor = Folio.colors.canvas,
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Folio.colors.canvas),
                title = { Text("Templates", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back") }
                },
            )
        },
    ) { padding ->
        val s = state ?: return@Scaffold
        val items = remember(s, category) { s.items.filter { category == null || it.template.category == category } }
        Column(Modifier.fillMaxSize().padding(padding)) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                item {
                    CategoryChip("All", category == null) { categoryName = null }
                }
                items(TemplateCategory.entries) { c ->
                    CategoryChip(c.label, category == c) { categoryName = c.name }
                }
            }
            if (items.isEmpty()) return@Column
            val initial = items.indexOfFirst { it.template.id == s.resume.style.templateId }.coerceAtLeast(0)
            val pager = rememberPagerState(initialPage = initial) { items.size }
            LaunchedEffect(category) { pager.scrollToPage(initial) }
            HorizontalPager(
                state = pager,
                contentPadding = PaddingValues(horizontal = 56.dp),
                pageSpacing = 16.dp,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                key = { items[it].template.id },
            ) { page ->
                val item = items[page]
                val offset = ((pager.currentPage - page) + pager.currentPageOffsetFraction).absoluteValue.coerceIn(0f, 1f)
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    PageCanvas(
                        document = item.document,
                        pageIndex = 0,
                        images = vm.images,
                        elevation = 10.dp,
                        corner = 4.dp,
                        modifier = Modifier
                            .widthIn(max = 460.dp)
                            .fillMaxWidth()
                            .graphicsLayer {
                                val scale = lerp(1f, 0.9f, offset)
                                scaleX = scale
                                scaleY = scale
                                alpha = lerp(1f, 0.6f, offset)
                            },
                    )
                }
            }
            val current = items.getOrNull(pager.currentPage) ?: return@Column
            Column(
                Modifier.fillMaxWidth().background(Folio.colors.background).navigationBarsPadding().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(current.template.name, style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
                }
                Spacer(Modifier.height(4.dp))
                Text(current.template.tagline, style = MaterialTheme.typography.bodyMedium, color = Folio.colors.secondary)
                Spacer(Modifier.height(4.dp))
                Text(
                    "${current.template.category.label}  ·  ATS: ${current.template.atsRating.label}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Folio.colors.secondary,
                )
                Spacer(Modifier.height(16.dp))
                val inUse = current.template.id == s.resume.style.templateId
                PillButton(
                    text = if (inUse) "In use" else "Use ${current.template.name}",
                    enabled = !inUse,
                    onClick = { vm.apply(current.template, onBack) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun CategoryChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            containerColor = Color.Transparent,
            selectedContainerColor = Folio.colors.ink,
            selectedLabelColor = Folio.colors.background,
            labelColor = Folio.colors.ink,
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = Folio.colors.separator,
            selectedBorderColor = Folio.colors.ink,
        ),
    )
}
