<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  labels: { type: Array, required: true },
  data: { type: Array, required: true },
});

const chartCanvas = ref(null);
let chartInstance = null;

const createChart = () => {
  if (chartInstance) chartInstance.destroy();
  if (!chartCanvas.value) return;
  chartInstance = new Chart(chartCanvas.value, {
    type: "bar",
    data: {
      labels: props.labels,
      datasets: [
        {
          label: "Лайки полученные",
          data: props.data.likesReceived,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "Комментарии",
          data: props.data.comments,
          backgroundColor: "rgba(255, 206, 86, 0.5)",
        },
        // можно добавить и другие наборы данных
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

watch([() => props.labels, () => props.data], createChart, { deep: true });
onMounted(createChart);
</script>
